import express from 'express';
import http from 'http';
import { Socket } from 'socket.io';

import Lobby from './controllers/lobby';
import Room from './controllers/room';

const PORT = process.env.PORT || 3333;
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

//const lobby = new Lobby(50);
const test_room = new Room(1);

io.on('connection', (socket: Socket) => {
  console.log(`> New Connection: ${socket.id}`);

  socket.on('enter_game', ({ username }) => {
    if (!test_room.available()) return;
    console.log(`> Connecting: ${username} to a room...`);
    test_room.addPlayer(socket, username);
  });

  socket.on('disconnect', () => {
    console.log(`> Disconnection: ${socket.id}`);
    test_room.removePlayer(socket);
  });

  socket.on('chat_message', (message: string) => {
    if (message.length > 50) return;
    test_room.sendMessage(message);
  });

  socket.on('stop', () => {});
});

server.listen(PORT, () =>
  console.log(`> Server is listening on port ${PORT}.`)
);
