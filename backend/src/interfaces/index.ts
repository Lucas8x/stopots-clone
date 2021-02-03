import Room from '../controllers/room';
import Player from '../controllers/player';

export interface IPlayerParams {
  username: string;
  avatar_id?: number;
}

export interface IDirectEnterParams {
  room_id: number;
  player_data: IPlayerParams;
}

export interface IRoomParams {
  max_rounds: number;
  max_players: number;
  timer: number;
  password: string;
  categories: string[];
  letters: string[];
}

export interface IRoom extends Partial<IRoomParams> {
  owner?: string;
  expires?: number;
}

export interface ICreateRoomParams {
  room_params: IRoomParams;
  player_data: IPlayerParams;
}

export interface IRooms {
  [id: number]: Room;
}

export interface IAnswer {
  category: string[];
}

export interface IPlayers {
  [id: string]: Player;
}
