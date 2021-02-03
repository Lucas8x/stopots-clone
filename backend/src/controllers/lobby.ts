import { Socket } from 'socket.io';
import chalk from 'chalk';

import Room from './room';
import { IPlayerParams, IRooms, IRoom } from '../interfaces';
import { CATEGORIES, LETTERS, TIME } from '../constants';
//import randomArrItem from '../utils/randomArrayItem';
import randomWithExclude from '../utils/randomWithExclude';

export default class Lobby {
  private rooms: IRooms;

  constructor(private max_rooms: number = 50) {
    this.rooms = {};
  }

  public getRoom(id: number): Room {
    return this.rooms[id];
  }

  public getAllRooms(): IRooms {
    return this.rooms;
  }

  private usedRoomsID(): number[] {
    const used_ids = Object.keys(this.rooms).map((id) => parseInt(id));
    return used_ids;
  }

  public createRoom({
    max_rounds = 8,
    max_players = 10,
    timer = TIME.medium,
    password = null,
    categories = CATEGORIES,
    letters = LETTERS,
    owner = null,
    expires = 120000,
  }: IRoom = {}): number {
    if (Object.keys(this.rooms).length === this.max_rooms) {
      return;
    }

    const id = randomWithExclude(1, this.max_rooms, this.usedRoomsID());
    this.rooms[id] = new Room(
      id,
      max_rounds,
      max_players,
      timer,
      password,
      categories,
      letters,
      owner,
      expires
    );
    console.log(chalk`[{yellow LOBBY}] Created room: ${id}`);
    return id;
  }

  public deleteRoom(id: number): void {
    if (this.getRoom(id)) {
      delete this.rooms[id];
      console.log(chalk`[{yellow LOBBY}] Deleted room: ${id}`);
    }
  }

  private getAvaliableRooms(): IRooms {
    const avaliable_rooms = Object.values(this.rooms).map((room: Room) => {
      if (room.available()) {
        return room;
      }
    });
    return avaliable_rooms;
  }

  public findSuitableRooms(): IRooms {
    const avaliable_rooms = this.getAvaliableRooms();
    const sorted_rooms = Object.values(avaliable_rooms).sort(
      (a, b) => a.getInfo().players - b.getInfo().players
    );
    return sorted_rooms;
  }

  public directEnterRoom(
    socket: Socket,
    room_id: number,
    player_data: IPlayerParams
  ): void {
    const room = this.getRoom(room_id);
    if (room?.available()) {
      room.addPlayer(socket, player_data);
    }
  }

  public quickJoin(socket: Socket, player_data: IPlayerParams): void {
    console.log(chalk`[{yellow LOBBY}] ${player_data.username} matchmaking...`);
    const suitable_rooms = this.findSuitableRooms();

    const room_id =
      Object.keys(suitable_rooms).length > 0
        ? suitable_rooms[0].id
        : this.createRoom();

    this.directEnterRoom(socket, room_id, player_data);
  }

  public disconnect(socket: Socket): void {
    const room_id = socket['current_room_id'];
    if (room_id) this.getRoom(room_id).removePlayer(socket);
  }
}
