const removeUserFromRoom = (socketId, rooms) => {
  let removedFrom = null;
  for (const [name, users] of rooms) {
    const userIndex = users.findIndex((user) => user.socketid === socketId);
    if (userIndex !== -1) {
      users.splice(userIndex, 1);

      // later add emit message to other users about disconnected user

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
