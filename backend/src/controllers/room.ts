import { Socket } from 'socket.io';


import Player from './player';
import { lobby } from '../server';
import { CATEGORIES, LETTERS, TIME } from '../constants';
import { IAnswer, IPlayerParams, IPlayers } from '../interfaces';
//import randItem from '../utils/randomArrayItem';
export default class Room {
  private current_letter: string = undefined;
  private current_round: number = 1;
  private players: IPlayers = {};
  private answers: IAnswer[] = [];

  constructor(
    public id: number,
    public max_rounds: number = 8,
    public max_players: number = 10,
    private timer: number = TIME.medium,
    private password: string = '',
    private categories: string[] = CATEGORIES,
    public letters: string[] = LETTERS,
    public owner: string = null
  ) {
    this.current_letter;
    this.current_round;
    this.players;
    this.answers;
  }

  private playersLength = (): number => Object.keys(this.players).length;

  public getInfo = () => ({
    id: this.id,
    players: this.playersLength(),
    max_players: this.max_players,
    current_round: this.current_round,
    max_rounds: this.max_rounds,
    timer: this.timer,
    protected: this.password ? true : false,
    categories: this.categories,
    letters: this.letters,
  });

  private returnState = () => ({
    id: this.id,
    current_letter: this.current_letter,
    current_round: this.current_round,
    max_rounds: this.max_rounds,
    max_players: this.max_players,
    players: Object.values(this.players).map((p) => p.getInfo()),
  });

  public available = (): boolean => this.playersLength() < this.max_players;

  public validatePassword = (password: string): boolean =>
    password === this.password ? true : false;

  private emitToAll(event: string, ...args: any[]): void {
    Object.values(this.players).forEach((player) => {
      player.socket.emit(event, ...args);
    });
  }

  public addPlayer(socket: Socket, player_data: IPlayerParams): void {
    if (this.players[socket.id]) {
      return;
    }

    const { username, avatar_id } = player_data;
    const player = new Player(socket, username, avatar_id);
    socket['current_room_id'] = this.id;
    this.players[socket.id] = player;
    player.socket.emit('current_room_state', this.returnState());
    console.log(`[ROOM][${this.id}] ${player.username} joined.`);
  }

  public removePlayer(socket: Socket): void {
    const player = this.players[socket.id];
    if (!player) return;

    delete this.players[socket.id];
    delete socket['current_room_id'];
    this.emitToAll('player_disconnect', player.socket.id);
    console.log(`[ROOM][${this.id}] ${player.username} left.`);
  }

  public sendMessage(message: string): void {
    this.emitToAll('chat_message', message);
  }

  public OwnerStart(socket: Socket): void {
    if (socket.id === this.owner) this.init();
  }

  public stop(socket: Socket): void {
    const player_name = this.players[socket.id].username;
    this.emitToAll('stop', player_name);
    console.log(`[ROOM][${this.id}] STOP! by ${player_name}.`);
  }

  private timeout(): void {
    this.emitToAll('timeout');
  }

  public delete(
    game_loop: NodeJS.Timeout,
    inactivity_loop: NodeJS.Timeout
  ): void {
    clearInterval(game_loop);
    clearInterval(inactivity_loop);
    lobby.deleteRoom(this.id);
  }

  public init(): void {
    const game_loop = setInterval(() => {
      console.log(`[ROOM][${this.id}] Timeout.`);
      this.timeout();
    }, this.timer);

    const inactivity_loop = setInterval(() => {
      if (this.playersLength() === 0) {
        console.log(
          `[ROOM][${this.id}] has been inactive for a long time. Deleting...`
        );
        this.delete(game_loop, inactivity_loop);
      }
    }, 120000); // 2m
  }
}
