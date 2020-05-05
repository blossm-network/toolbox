const express = require("express");

const server = express();

const mocks = JSON.parse(process.env.MOCKS);

for (const mock of mocks) {
  server[mock.method.toLowerCase()](mock.path, (_, res) => {
    res.status(mock.code).send(mock.response);
  });
}

server.listen(process.env.PORT);

//TODO
//eslint-disable-next-line no-console
console.log(`Dependency server started on port: ${process.env.PORT}`);

module.exports = server;
