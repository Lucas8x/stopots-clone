import { CATEGORIES, LETTERS } from '../constants';
import Room from './room';
import randomInt from '../utils/randomInteger';
//import randomArrItem from '../utils/randomArrayItem';

export default class Lobby {
  rooms: Room[];
  max_rooms = 100;

  constructor(max_rooms: number) {
    this.rooms = [];
    this.max_rooms = max_rooms;
  }

  unavailableRoomsID() {
    const unavailable_ids = this.rooms.map((room) => {
      return room.id;
    });
    return unavailable_ids;
  }

  getAvaliableRooms() {
    const avaliable_rooms = this.rooms.map((room) => {
      if (room.available()) {
        return room;
      }
    });
    return avaliable_rooms;
  }

  createRoom(
    letters: string[],
    categories: string[],
    total_rounds: number,
    max_players: number
  ) {
    if (this.rooms.length === this.max_rooms) {
      return 0;
    }

    const avaliable_id = 1;
    const new_room = new Room(
      avaliable_id,
      letters,
      categories,
      total_rounds,
      max_players
    );
    this.rooms.push(new_room);
    console.log(`> Created room: ${avaliable_id}`);
  }

  findRoom() {
    const avaliable_rooms = this.getAvaliableRooms();
    console.log(avaliable_rooms);
  }

  init() {}
}
