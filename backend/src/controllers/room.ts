import { Socket } from 'socket.io';
import chalk from 'chalk';

import Player from './player';
import { lobby } from '../server';
import { CATEGORIES, LETTERS, TIME } from '../constants';
import { IPlayerParams, IPlayers, IRoom } from '../interfaces';
//import randItem from '../utils/randomArrayItem';

export default class Room {
  private current_letter: string;
  private current_round: number;
  private players: IPlayers;
  private answers: string[];

  constructor(
    public id: number,
    public max_rounds: number = 8,
    public max_players: number = 10,
    private timer = TIME.medium,
    private password: string = '',
    private categories: string[] = CATEGORIES,
    public letters: string[] = LETTERS,
    public owner: string = null,
    private expires: number = 120000
  ) {
    this.current_letter = undefined;
    this.current_round = 1;
    this.players = {};
    this.answers = [];
  }

  private playersLength = (): number => Object.keys(this.players).length;

  public getInfo = () => ({
    id: this.id,
    players: this.playersLength(),
    max_players: this.max_players,
    current_round: this.current_round,
    max_rounds: this.max_rounds,
    timer: this.timer,
    protected: !!this.password,
    categories: this.categories,
    letters: this.letters,
  });

  private returnState = () => ({
    current_letter: this.current_letter,
    current_round: this.current_round,
    max_rounds: this.max_rounds,
    max_players: this.max_players,
    players: Object.values(this.players).map((p) => p.getInfo()),
  });

  public available = (): boolean => this.playersLength() < this.max_players;

  public validatePassword = (password: string): boolean =>
    password === this.password;

  private emitToAll(event: string, ...args: any[]): void {
    Object.values(this.players).forEach((player) => {
      player.socket.emit(event, ...args);
    });
  }

  public addPlayer(socket: Socket, player_data: IPlayerParams): void {
    if (this.players[socket.id]) return;

    const { username, avatar_id } = player_data;
    const player = new Player(socket, username, avatar_id);
    socket['current_room_id'] = this.id;
    this.players[socket.id] = player;
    player.socket.emit('current_room_state', this.returnState());
    console.log(
      chalk`[{cyan ROOM}][{cyan ${this.id}}] ${player.username} joined.`
    );
  }

  public removePlayer(socket: Socket): void {
    const player = this.players[socket.id];
    if (!player) return;

    delete this.players[socket.id];
    delete socket['current_room_id'];
    this.emitToAll('player_disconnect', player.socket.id);
    console.log(
      chalk`[{cyan ROOM}][{cyan ${this.id}}] ${player.username} left.`
    );
  }

  public sendMessage(message: string): void {
    this.emitToAll('chat_message', message);
  }

  public ownerStart(socket: Socket): void {
    if (socket.id === this.owner) this.init();
  }

  public stop(socket: Socket): void {
    const player_name = this.players[socket.id].username;
    this.emitToAll('stop', player_name);
    console.log(
      chalk`[{cyan ROOM}][{cyan ${this.id}}] STOP! by ${player_name}.`
    );
  }

  public switchReady(socket: Socket): void {
    this.players[socket.id].switchReady();
  }

  private timeout(): void {
    this.emitToAll('timeout');
    console.log(chalk`[{cyan ROOM}][{cyan ${this.id}}] Timeout.`);
  }

  public delete(
    game_loop: NodeJS.Timeout,
    inactivity_loop: NodeJS.Timeout
  ): void {
    console.log(
      chalk`[{cyan ROOM}][{cyan ${this.id}}] has been inactive for a long time. Deleting...`
    );
    clearInterval(game_loop);
    clearInterval(inactivity_loop);
    lobby.deleteRoom(this.id);
  }

  public restart() {
    this.current_round = 1;
    Object.values(this.players).forEach((player) => {
      player.resetPoints();
    });
    this.emitToAll('restart', {
      current_round: this.current_round,
      players: Object.values(this.players).map((p) => p.getInfo()),
    });
  }

  public init(): void {
    const game_loop = setInterval(() => {
      if (this.playersLength() === 0) return;

      this.timeout();
    }, this.timer);

    if (this.expires > 0) {
      const inactivity_loop = setInterval(() => {
        if (this.playersLength() === 0) {
          this.delete(game_loop, inactivity_loop);
        }
      }, this.expires);
    }
  }
}
