import { Socket } from 'socket.io';

export default class Player {
  constructor(
    public socket: Socket,
    public username: string,
    public avatar_id: number = 0,
    public points: number = 0,
    public answers: string[]
  ) {}

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
