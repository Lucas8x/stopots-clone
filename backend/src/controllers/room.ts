import { Socket } from 'socket.io';

import { CATEGORIES, LETTERS, TIME } from '../constants';
import randItem from '../utils/randomArrayItem';
import Player from './player';

interface IAnswer {
  category: string[];
}

interface IPlayers {
  [id: string]: Player;
}

export default class Room {
  public id: number;
  public max_rounds: number;
  public max_players: number;
  private timer: TIME;
  private password: string;
  private categories: string[];
  public letters: string[];
  private current_letter: string;
  public current_round: number;
  private players: IPlayers;
  //private answers: IAnswer[];

  constructor(
    id: number,
    max_rounds: number = 8,
    max_players: number = 10,
    timer: number = TIME.medium,
    password: string = '',
    categories: string[] = CATEGORIES,
    letters: string[] = LETTERS
  ) {
    this.id = id;
    this.max_rounds = max_rounds;
    this.max_players = max_players;
    this.timer = timer;
    this.password = password;
    this.categories = categories;
    this.letters = letters;
    this.current_letter = undefined;
    this.current_round = 1;
    this.players = {};
    //this.answers = [];
  }

  public getInfo = () => ({
    id: this.id,
    players: Object.keys(this.players).length,
    max_players: this.max_players,
    current_round: this.current_round,
    max_rounds: this.max_rounds,
    timer: this.timer,
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

  public available = () =>
    Object.keys(this.players).length === this.max_players ? false : true;

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
    player.current_room = this.id;
    socket['current_room_id'] = this.id;
    this.players[socket.id] = player;
    player.socket.emit('current_room_state', this.returnState());
    console.log(`> ${player.username} entered room ${this.id}`);
  }

  public removePlayer(socket: Socket) {
    delete this.players[socket.id];
    delete socket['current_room_id'];
    console.log(`> ${socket.id} left room ${this.id}`);
  }

  public sendMessage(message: string) {
    if (message.length > 50) return;
    this.emitToAll('chat_message', message);
  }

  public stop(socket: Socket) {
    const player_name = this.players[socket.id].username;
    this.emitToAll('stop', player_name);
  }

  private timeout() {
    this.emitToAll('timeout');
  }

  public destroy() {}

  game_loop() {
    setInterval(() => {}, this.timer);
  }
}
