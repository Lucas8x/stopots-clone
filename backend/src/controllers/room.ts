import { Socket } from 'socket.io';

import { CATEGORIES, LETTERS } from '../constants';
import randInt from '../utils/randomInteger';
import randItem from '../utils/randomArrayItem';
import Player from './player';

interface Answer {
  category: string[];
}

interface IPlayers {}

export default class Room {
  id: number;
  current_letter: string;
  letters: string[];
  categories: string[];
  current_round: number;
  total_rounds: number;
  players: Player[];
  max_players: number;
  answers: Answer[];

  constructor(
    id: number,
    letters: string[] = LETTERS,
    categories: string[] = CATEGORIES,
    total_rounds: number = 8,
    max_players: number = 10
  ) {
    this.id = id;
    this.current_letter = undefined;
    this.letters = letters;
    this.categories = categories;
    this.current_round = 1;
    this.total_rounds = total_rounds;
    this.players = [];
    this.max_players = max_players;
    this.answers = [];
  }

  returnState() {
    return {
      id: this.id,
      current_letter: this.current_letter,
      current_round: this.current_round,
      total_rounds: this.total_rounds,
      max_players: this.max_players,
      players: this.players.map((p) => p.getInfo()),
    };
  }

  available() {
    if (this.players.length === this.max_players) {
      return 0;
    }
    return 1;
  }

  addPlayer(socket: Socket, username: string) {
    if (this.players.find((p) => p.socket.id === socket.id)) {
      return 0;
    }

    let player = new Player(socket, username);
    this.players.push(player);
    player.socket.emit('current_room_state', this.returnState());
    console.log(`> ${player.username} entered room ${this.id}`);
  }

  removePlayer(socket: Socket) {
    this.players = this.players.filter(
      (player) => player.socket.id !== socket.id
    );
    console.log(`> ${socket.id} left room ${this.id}`);
  }

  sendMessage(message: string) {
    this.players.forEach((player) => {
      player.socket.emit('chat_message', message);
    });
  }

  game_loop() {
    setInterval(() => {}, 30000);
  }

  destroy() {}
}
