import express from 'express';
import http from 'http';
import { Socket, listen } from 'socket.io';

import Lobby from './controllers/lobby';

const PORT = process.env.PORT || 3333;
const app = express();
const server = http.createServer(app);
const io = listen(server);

const lobby = new Lobby(50);
lobby.init();

io.on('connection', (socket: Socket) => {
  console.log(`> New Connection: ${socket.id}`);

  socket.on('enter_game', ({ username }) => {
    console.log(`> Connecting: ${username} to a room...`);
    lobby.quickJoin(socket, username);
  });

  socket.on('enter_with_id', ({ room_id, username }) => {
    lobby.directEnterRoom(socket, room_id, username);
  });

  socket.on('disconnect', () => {
    console.log(`> Disconnection: ${socket.id}`);
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
    }) => {
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
