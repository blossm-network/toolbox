const express = require("express");

const server = express();
server.get(process.env.URL_PATH, (_, res) => {
  res.status(process.env.CODE).send(JSON.parse(process.env.RESPONSE));
});
server.post(process.env.URL_PATH, (_, res) => {
  res.status(process.env.CODE).send(JSON.parse(process.env.RESPONSE));
});

server.listen(process.env.PORT);

//TODO
//eslint-disable-next-line no-console
console.log(`Dependency server started on port: ${process.env.PORT}`);

module.exports = server;
