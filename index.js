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

const removeUserFromRoom = (socketId) => {
  for (const [name, userIds] of rooms) {
    const userIdIndex = userIds.indexOf(socketId);
    if (userIdIndex !== -1) {
      userIds.splice(userIdIndex, 1);

      // later add emit message to other users about disconnected user

      if (userIds.length === 0) rooms.delete(name);
      return;
    }
  }
};

io.on("connection", (socket) => {
  socket.on("create-room", (roomName) => {
    if (!rooms.has(roomName)) {
      rooms.set(roomName, []);
      rooms.get(roomName).push(socket.id);
      socket.emit("room-created", { roomName });
      socket.join(roomName);
    } else {
      socket.emit("room-exists", { message: "Room already exists!" });
    }
  });

  socket.on("disconnect", () => {
    removeUserFromRoom(socket.id);
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
      rooms.get(roomName).push(socket.id);
      io.sockets.in(roomName).emit("room-joined", roomName);
    }
  });

  socket.on("leave-room", (room) => {
    removeUserFromRoom(socket.id);
    socket.leave(room);
    console.log(rooms);
  });

  socket.on("user-joined", (currentRoom) => {
    //returning user to the room on page reload
    if (rooms.has(currentRoom) && !rooms.get(currentRoom).includes(socket.id)) {
      socket.join(currentRoom);
      rooms.get(currentRoom).push(socket.id);
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
