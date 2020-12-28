import { Socket } from 'socket.io';

import { CATEGORIES, LETTERS, TIME } from '../constants';
import Room from './room';
//import randomArrItem from '../utils/randomArrayItem';
import randomWithExclude from '../utils/randomWithExclude';

interface IRooms {
  [id: number]: Room;
}

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

  public createRoom(
    max_rounds: number = 8,
    max_players: number = 10,
    timer: number = TIME.medium,
    password: string = '',
    categories: string[] = CATEGORIES,
    letters: string[] = LETTERS
  ): number {
    if (Object.keys(this.rooms).length === this.max_rooms) {
      return null;
    }

    const id = randomWithExclude(0, this.max_rooms, this.usedRoomsID());
    this.rooms[id] = new Room(
      id,
      max_rounds,
      max_players,
      timer,
      password,
      categories,
      letters
    );
    console.log(`[LOBBY] Created room: ${id}`);
    return id;
  }

  public deleteRoom(id: number) {
    if (this.rooms[id]) {
      delete this.rooms[id];
      console.log(`[LOBBY] Deleted room: ${id}`);
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

  public directEnterRoom(
    socket: Socket,
    room_id: number,
    username: string
  ): void {
    if (this.rooms[room_id]) {
      this.rooms[room_id].addPlayer(socket, username);
    }
  }

  public findSuitableRooms(): IRooms {
    const avaliable_rooms = this.getAvaliableRooms();
    const sorted_rooms = Object.values(avaliable_rooms).sort(
      (a, b) => a.getInfo().players - b.getInfo().players
    );
    return sorted_rooms;
  }

  public quickJoin(socket: Socket, username: string): void {
    console.log(`[LOBBY] ${username} matchmaking...`);
    const suitable_rooms = this.findSuitableRooms();
    Object.keys(suitable_rooms).length > 0
      ? this.directEnterRoom(socket, suitable_rooms[0].id, username)
      : this.directEnterRoom(socket, this.createRoom(), username);
  }

  public init(): void {
    const room = this.getRoom(this.createRoom());
    room.init();
    console.log(room.getInfo());
  }
}
