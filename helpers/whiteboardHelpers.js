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

const emitRoomsOnChange = (rooms, io, emitTo) => {
  const roomUserList = [];
  rooms.forEach((users, roomName) => {
    const usernames = users.map((user) => user.username);
    roomUserList.push({ roomName: roomName, users: usernames });
  });

  io.emit("rooms", roomUserList);
};

module.exports = { removeUserFromRoom, emitRoomsOnChange };
