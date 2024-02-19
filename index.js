const express = require("express");
const http = require("http");
const { initilizeWhiteboardSocket } = require("./sockets/whiteboardSocket");
const app = express();
const server = http.createServer(app);

initilizeWhiteboardSocket(server);

server.listen(3001, () => {
  console.log(`Server is running on port 3001`);
});
