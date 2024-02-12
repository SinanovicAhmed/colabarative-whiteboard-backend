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

const rooms = new Map();

io.on("connection", (socket) => {
  socket.on("create-room", (roomName) => {
    if (!rooms.has(roomName)) {
      rooms.set(roomName, []);
      socket.emit("room-created", { roomName });
      socket.join(roomName);
    } else {
      socket.emit("room-exists", { message: "Room already exists!" });
    }
  });

  socket.on("disconnect", () => {
    //not working for now
  });

  socket.on("get-rooms", () => {
    const roomNames = Array.from(rooms.keys());
    socket.emit("rooms", roomNames);
  });

  socket.on("join-room", (roomName) => {
    if (!rooms.has(roomName)) {
      socket.emit("room-not-found", { message: "Room does not exist!" });
    } else {
      const roomData = rooms.get(roomName);
      socket.join(roomName);
      io.sockets.in(roomName).emit("room-joined", roomName);
    }
    const numUsersInRoom = io.sockets.adapter.rooms.get(roomName)?.size;
    console.log(`Number of users in room: ${numUsersInRoom}`, io.sockets.adapter.rooms.get(roomName));
  });

  socket.on("user-joined", (currentRoom) => {
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
