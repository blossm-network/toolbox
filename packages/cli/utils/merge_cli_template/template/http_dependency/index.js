const express = require("express");

const jsonString = (string) => {
  try {
    return JSON.parse(string);
  } catch (e) {
    return null;
  }
};

const server = express();
server.get(process.env.URL_PATH, (_, res) => {
  res
    .status(process.env.CODE)
    .send(jsonString(process.env.RESPONSE) || process.env.RESPONSE);
});
server.post(process.env.URL_PATH, (_, res) => {
  res
    .status(process.env.CODE)
    .send(jsonString(process.env.RESPONSE) || process.env.RESPONSE);
});

server.listen(process.env.PORT);

//TODO
//eslint-disable-next-line no-console
console.log(`Dependency server started on port: ${process.env.PORT}`);

module.exports = server;
