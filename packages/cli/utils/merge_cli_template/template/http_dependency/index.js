const express = require("express");

const server = express();

const mocks = JSON.parse(process.env.MOCKS);

const counts = {};

for (const mock of mocks) {
  const key = `${mock.method}-${mock.path}`;
  counts[key] = 0;
  server[mock.method.toLowerCase()](mock.path, (_, res) => {
    const count = counts[key]++;
    res.status(mock.calls[count].code).send(mock.calls[count].response);
  });
}

server.listen(process.env.PORT);

//eslint-disable-next-line no-console
console.log(`Dependency server started on port: ${process.env.PORT}`);

module.exports = server;
