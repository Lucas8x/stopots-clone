import express from 'express';
import http from 'http';
import { Socket, listen } from 'socket.io';

import Lobby from './controllers/lobby';

const PORT = process.env.PORT || 3333;
const app = express();
const server = http.createServer(app);
const io = listen(server);

export const lobby = new Lobby(50);
lobby.init();

io.on('connection', (socket: Socket) => {
  console.log(`> New Connection: ${socket.id}`);

  socket.on('enter_game', ({ username }: IPlayerParams) => {
    console.log(`> Connecting: ${username} to a room...`);
    lobby.quickJoin(socket, username);
  });

  socket.on('enter_with_id', ({ room_id, username }: IDirectEnterParams) => {
    lobby.directEnterRoom(socket, room_id, username);
  });

  socket.on('disconnect', () => {
    console.log(`> Disconnection: ${socket.id}`);
    if (socket['current_room_id'])
      lobby.getRoom(socket['current_room_id']).removePlayer(socket);
  });

  socket.on('chat_message', (message: string) => {
    lobby.getRoom(socket['current_room_id']).sendMessage(message);
  });

  socket.on(
    'create_room',
    ({
      username,
      max_rounds,
      max_players,
      timer,
      password,
      categories,
      letters,
    }: IRoomParams) => {
      const room_id = lobby.createRoom(
        max_rounds,
        max_players,
        timer,
        password,
        categories,
        letters
      );
      lobby.directEnterRoom(socket, room_id, username);
    }
  );

  socket.on('stop', () => {
    lobby.getRoom(socket['current_room_id']).stop(socket);
  });
});

server.listen(PORT, () =>
  console.log(`> Server is listening on port ${PORT}.`)
);

interface IDirectEnterParams {
  room_id: number;
  username: string;
}

interface IPlayerParams {
  username: string;
}

interface IRoomParams {
  username: string;
  max_rounds: number;
  max_players: number;
  timer: number;
  password: string;
  categories: string[];
  letters: string[];
}
