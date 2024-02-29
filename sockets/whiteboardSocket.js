const { Server } = require("socket.io");
const { removeUserFromRoom, emitRoomsOnChange } = require("../helpers/whiteboardHelpers");

const initilizeWhiteboardSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  const rooms = new Map();
  io.on("connection", (socket) => {
    /*CREATING AND JOINING ROOMS*/
    socket.on("create-room", ({ roomName, userName }) => {
      if (!rooms.has(roomName)) {
        rooms.set(roomName, []);
        rooms.get(roomName).push({ socketid: socket.id, username: userName });
        socket.emit("room-created", { roomName });
        socket.join(roomName);
        emitRoomsOnChange(rooms, io, roomName);
      } else {
        socket.emit("room-exists");
      }
    });

    socket.on("join-room", ({ roomName, userName }) => {
      if (!rooms.has(roomName)) {
        socket.emit("room-not-found", { message: "Room does not exist!" });
      } else {
        socket.join(roomName);
        rooms.get(roomName).push({ socketid: socket.id, username: userName });
        socket.emit("room-joined", roomName);
        emitRoomsOnChange(rooms, io, roomName);
      }
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
      emitRoomsOnChange(rooms, io, currentRoom);
    });

    socket.on("get-rooms", () => {
      const roomUserList = [];
      rooms.forEach((users, roomName) => {
        const usernames = users.map((user) => user.username);
        roomUserList.push({ roomName: roomName, users: usernames });
      });
      socket.emit("rooms", roomUserList);
    });

    /*DISCONNECTION AND LEAVING ROOMS*/
    socket.on("disconnect", () => {
      const removedFrom = removeUserFromRoom(socket.id, rooms);
      emitRoomsOnChange(rooms, io, removedFrom);
    });

    socket.on("leave-room", (room) => {
      removeUserFromRoom(socket.id, rooms);
      socket.leave(room);
      emitRoomsOnChange(rooms, io, room);
    });

    /*CANVAS FUNCTIONS*/
    socket.on("canvas-state", ({ dataURL, currentRoom }) => {
      io.sockets.in(currentRoom).emit("requested-canvas-state", dataURL);
    });

    socket.on("drawing", ({ prevPoint, currentPoint, color, currentRoom }) => {
      io.sockets.in(currentRoom).emit("drawing", { prevPoint, currentPoint, color });
    });

    socket.on("clearCanvas", (roomName) => io.sockets.in(roomName).emit("clearCanvas"));

    socket.on("message", ({ message, currentRoom }) => {
      socket.broadcast.to(currentRoom).emit("emit-message", message);
    });
  });
};

module.exports = { initilizeWhiteboardSocket };
