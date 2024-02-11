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

io.on("connection", (socket) => {
  socket.on("user-joined", () => {
    socket.broadcast.emit("request-canvas-state");
  });

  socket.on("canvas-state", (state) => {
    socket.broadcast.emit("requested-canvas-state", state);
  });

  socket.on("drawing", ({ prevPoint, currentPoint, color }) => {
    socket.broadcast.emit("drawing", { prevPoint, currentPoint, color });
  });

  socket.on("clearCanvas", () => io.emit("clearCanvas"));
});

server.listen(3001, () => {
  "Server is running on port 3001";
});
