import { Socket } from 'socket.io';

import { IPlayerAnswers } from '../interfaces';

export default class Player {
  public points: number;
  public answers: IPlayerAnswers;
  public ready: boolean;

  constructor(
    public socket: Socket,
    public username: string,
    public avatar_id: number = 0
  ) {
    this.points = 0;
    this.answers = {};
    this.ready = false;
  }

  public getInfo = () => ({
    id: this.socket.id,
    username: this.username,
    avatar_id: this.avatar_id,
    points: this.points,
  });

  public resetPoints() {
    this.points = 0;
  }

  public increasePoints(x: number) {
    this.points += x;
  }

  public switchReady() {
    this.ready = !this.ready;
  }
}
