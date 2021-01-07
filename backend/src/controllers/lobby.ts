import { Socket } from 'socket.io';

import Room from './room';
import { IPlayerParams, IRooms } from '../interfaces';
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

  public createRoom(
    max_rounds: number = 8,
    max_players: number = 10,
    timer: number = TIME.medium,
    password: string = null,
    categories: string[] = CATEGORIES,
    letters: string[] = LETTERS,
    owner: string = null
  ): number {
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
      owner
    );
    console.log(`[LOBBY] Created room: ${id}`);
    return id;
  }

  public deleteRoom(id: number): void {
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
    const room = this.rooms[room_id];
    if (room.available()) {
      room.addPlayer(socket, player_data);
    }
  }

  public quickJoin(socket: Socket, player_data: IPlayerParams): void {
    console.log(`[LOBBY] ${player_data.username} matchmaking...`);
    const suitable_rooms = this.findSuitableRooms();

    const room_id =
      Object.keys(suitable_rooms).length > 0
        ? suitable_rooms[0].id
        : this.createRoom();

    this.directEnterRoom(socket, room_id, player_data);
  }

  public init(): void {
    const room = this.getRoom(this.createRoom());
    room.init();
    //console.log(room.getInfo());
  }
}
