import { Socket } from 'socket.io';

export default class Player {
  public avatar_id: number;
  public points: number;
  public answers: string[];

  constructor(public socket: Socket, public username: string) {
    this.avatar_id = 0;
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
