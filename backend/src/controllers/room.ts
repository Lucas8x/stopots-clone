import { Socket } from 'socket.io';

import { CATEGORIES, LETTERS, TIME } from '../constants';
//import randItem from '../utils/randomArrayItem';
import { lobby } from '../server';
import Player from './player';

interface IAnswer {
  category: string[];
}

interface IPlayers {
  [id: string]: Player;
}

export default class Room {
  constructor(
    public id: number,
    public max_rounds: number = 8,
    public max_players: number = 10,
    private timer: number = TIME.medium,
    private password: string = '',
    private categories: string[] = CATEGORIES,
    public letters: string[] = LETTERS,
    private current_letter: string = undefined,
    private current_round: number = 1,
    private players: IPlayers = {},
    private answers: IAnswer[] = []
  ) {}

  public getInfo = () => ({
    id: this.id,
    players: Object.keys(this.players).length,
    max_players: this.max_players,
    current_round: this.current_round,
    max_rounds: this.max_rounds,
    timer: this.timer,
    categories: this.categories,
    letters: this.letters,
    protected: this.password ? true : false,
  });

  private returnState = () => ({
    id: this.id,
    current_letter: this.current_letter,
    current_round: this.current_round,
    max_rounds: this.max_rounds,
    max_players: this.max_players,
    players: Object.values(this.players).map((p) => p.getInfo()),
  });

  public available = () =>
    Object.keys(this.players).length === this.max_players ? false : true;

  public validatePassword = (password: string) =>
    password === this.password ? true : false;

  private emitToAll(event: string, data?: any) {
    Object.values(this.players).forEach((player) => {
      player.socket.emit(event, data);
    });
  }

  public addPlayer(socket: Socket, username: string): boolean {
    if (this.players[socket.id]) {
      return false;
    }

    let player = new Player(socket, username);
    socket['current_room_id'] = this.id;
    this.players[socket.id] = player;
    player.socket.emit('current_room_state', this.returnState());
    console.log(`[ROOM][${this.id}] ${player.username} joined.`);
  }

  public removePlayer(socket: Socket) {
    console.log(`[ROOM][${this.id}] ${this.players[socket.id].username} left.`);
    delete this.players[socket.id];
    delete socket['current_room_id'];
  }

  public sendMessage(message: string) {
    if (message.length > 50) return;
    this.emitToAll('chat_message', message);
  }

  public stop(socket: Socket) {
    const player_name = this.players[socket.id].username;
    this.emitToAll('stop', player_name);
    console.log(`[ROOM][${this.id}] STOP! by ${player_name}.`);
  }

  private timeout() {
    this.emitToAll('timeout');
  }

  public delete(game_loop: NodeJS.Timeout, inactivity_loop: NodeJS.Timeout) {
    console.log(
      `[ROOM][${this.id}] has been inactive for a long time. Deleting...`
    );
    clearInterval(game_loop);
    clearInterval(inactivity_loop);
    lobby.deleteRoom(this.id);
  }

  public init() {
    const game_loop = setInterval(() => {
      console.log(`[ROOM][${this.id}] Timeout.`);
      this.timeout();
    }, this.timer);

    const inactivity_loop = setInterval(() => {
      if (Object.values(this.players).length === 0) {
        this.delete(game_loop, inactivity_loop);
      }
    }, 120000); // 2m
  }
}
