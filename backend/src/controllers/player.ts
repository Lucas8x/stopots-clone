import { Socket } from 'socket.io';

export default class Player {
  socket: Socket;
  //id: string;
  username: string;
  avatar_id: number;
  current_room: number;
  points: number;
  answers: string[];

  constructor(socket: Socket, username: string, avatar_id: number = 0) {
    this.socket = socket;
    //this.id = socket.id;
    this.username = username;
    this.avatar_id = avatar_id;
    this.points = 0;
    this.answers = [];
  }

  public getInfo = () => ({
    id: this.socket.id,
    username: this.username,
    avatar_id: this.avatar_id,
    points: this.points,
  });

  resetPoints() {
    this.points = 0;
  }

  increasePoints(x: number) {
    this.points += x;
  }
}
