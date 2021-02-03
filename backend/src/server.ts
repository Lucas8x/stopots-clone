import { Socket, Server } from 'socket.io';
import chalk from 'chalk';

import Lobby from './controllers/lobby';
import {
  ICreateRoomParams,
  IDirectEnterParams,
  IPlayerParams,
} from './interfaces';

const PORT = parseInt(process.env.PORT) || 3333;
const io = new Server(PORT, {
  allowEIO3: true,
});
console.log(chalk`[{magenta SERVER}] listening on port ${PORT}.`);

export const lobby = new Lobby(50);
lobby.createRoom({ expires: 0 });

io.on('connection', (socket: Socket) => {
  console.log(chalk`[{green IO}] New Connection: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(chalk`[{red IO}] Disconnected: ${socket.id}`);
    lobby.disconnect(socket);
  });

  socket.on('enter_game', (player_data: IPlayerParams) => {
    lobby.quickJoin(socket, player_data);
  });

  socket.on('enter_with_id', ({ room_id, player_data }: IDirectEnterParams) => {
    lobby.directEnterRoom(socket, room_id, player_data);
  });

  socket.on('exit', () => {
    lobby.disconnect(socket);
  });

  socket.on('chat_message', (message: string) => {
    const room_id = socket['current_room_id'];
    if (room_id && message.length <= 50)
      lobby.getRoom(room_id).sendMessage(message);
  });

  socket.on(
    'create_room',
    ({ room_params, player_data }: ICreateRoomParams) => {
      console.log(room_params);
      const room_id = lobby.createRoom({ ...room_params, owner: socket.id });
      if (room_id) lobby.directEnterRoom(socket, room_id, player_data);
    }
  );

  socket.on('start', () => {
    const room_id = socket['current_room_id'];
    if (room_id) lobby.getRoom(room_id).ownerStart(socket);
  });

  socket.on('stop', () => {
    const room_id = socket['current_room_id'];
    if (room_id) lobby.getRoom(room_id).stop(socket);
  });

  socket.on('ready', () => {
    const room_id = socket['current_room_id'];
    if (room_id) lobby.getRoom(room_id).switchReady(socket);
  });
});
