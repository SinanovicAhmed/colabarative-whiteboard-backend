const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const removeUserFromRoom = (socketId, rooms) => {
  for (const [name, users] of rooms) {
    const userIndex = users.findIndex((user) => user.socketid === socketId);
    if (userIndex !== -1) {
      users.splice(userIndex, 1);

      // later add emit message to other users about disconnected user

      if (users.length === 0) rooms.delete(name);
      return;
    }
  }
};

const emitRoomsOnChange = (rooms, io) => {
  const roomUserList = [];
  rooms.forEach((users, roomName) => {
    const usernames = users.map((user) => user.username);
    roomUserList.push({ roomName: roomName, users: usernames });
  });
  io.emit("rooms", roomUserList);
};

const rooms = new Map();
io.on("connection", (socket) => {
  socket.on("create-room", ({ roomName, userName }) => {
    if (!rooms.has(roomName)) {
      rooms.set(roomName, []);
      rooms.get(roomName).push({ socketid: socket.id, username: userName });
      socket.emit("room-created", { roomName });
      socket.join(roomName);
      emitRoomsOnChange(rooms, io);
    } else {
      socket.emit("room-exists", { message: "Room already exists!" });
    }
  });

  socket.on("disconnect", () => {
    removeUserFromRoom(socket.id, rooms);
    emitRoomsOnChange(rooms, io);
  });

  socket.on("get-rooms", () => {
    const roomUserList = [];
    rooms.forEach((users, roomName) => {
      const usernames = users.map((user) => user.username);
      roomUserList.push({ roomName: roomName, users: usernames });
    });
    socket.emit("rooms", roomUserList);
  });

  socket.on("join-room", ({ roomName, userName }) => {
    if (!rooms.has(roomName)) {
      socket.emit("room-not-found", { message: "Room does not exist!" });
    } else {
      socket.join(roomName);
      rooms.get(roomName).push({ socketid: socket.id, username: userName });
      io.sockets.in(roomName).emit("room-joined", roomName);
    }
  });

  socket.on("leave-room", (room) => {
    removeUserFromRoom(socket.id, rooms);
    socket.leave(room);
    emitRoomsOnChange(rooms, io);
  });

  socket.on("user-joined", ({ currentRoom, userName }) => {
    //returning user to the room on page reload
    if (rooms.has(currentRoom)) {
      const room = rooms.get(currentRoom);
      const userExistsInRoom = room.some((user) => user.socketid === socket.id);

      if (!userExistsInRoom) {
        socket.join(currentRoom);
        rooms.get(currentRoom).push({ socketid: socket.id, username: userName });
      }
    }

    if (!rooms.has(currentRoom)) io.to(socket.id).emit("room-doesnt-exist");
    io.sockets.in(currentRoom).emit("request-canvas-state");
  });

  socket.on("canvas-state", ({ dataURL, currentRoom }) => {
    io.sockets.in(currentRoom).emit("requested-canvas-state", dataURL);
  });

  socket.on("drawing", ({ prevPoint, currentPoint, color, currentRoom }) => {
    io.sockets.in(currentRoom).emit("drawing", { prevPoint, currentPoint, color });
  });

  socket.on("clearCanvas", (roomName) => io.sockets.in(roomName).emit("clearCanvas"));
});

server.listen(3001, () => {
  "Server is running on port 3001";
});
