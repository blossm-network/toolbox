const express = require("express");

const server = express();
server.get(process.env.path, (_, res) => {
  res.status(process.env.STATUS).send(JSON.parse(process.env.RESPONSE));
});
server.post(process.env.path, (_, res) => {
  res.status(process.env.STATUS).send(JSON.parse(process.env.RESPONSE));
});

server.listen(process.env.PORT);

//TODO
//eslint-disable-next-line no-console
console.log(`Dependency server started on port: ${process.env.PORT}`);

module.exports = server;
