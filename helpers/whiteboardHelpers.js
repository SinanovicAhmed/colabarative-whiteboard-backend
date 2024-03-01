const removeUserFromRoom = (socketId, rooms, io) => {
  let removedFrom = null;
  for (const [name, users] of rooms) {
    const userIndex = users.findIndex((user) => user.socketid === socketId);
    if (userIndex !== -1) {
      const { username } = users.splice(userIndex, 1)[0];
      io.sockets.in(name).emit("user-left", username);

      removedFrom = name;
      if (users.length === 0) rooms.delete(name);
      break;
    }
  }
  return removedFrom;
};

const emitRoomsOnChange = (rooms, io, roomName) => {
  const roomUserList = [];
  rooms.forEach((users, room) => {
    const usernames = users.map((user) => user.username);
    roomUserList.push({ roomName: room, users: usernames });
  });

  io.emit("rooms", roomUserList);
  if (roomName) io.sockets.in(roomName).emit("users-in-room", rooms.get(roomName));
};

module.exports = { removeUserFromRoom, emitRoomsOnChange };
