import server from "@blossm/server";
import { store } from "@blossm/mongodb-database";
import get from "@blossm/event-store-get";
import aggregateStream from "@blossm/event-store-aggregate-stream";
import rootStream from "@blossm/event-store-root-stream";
import count from "@blossm/event-store-count";
import post from "@blossm/event-store-post";
import createBlock from "@blossm/event-store-create-block";

export default {
  store,
  server,
  get,
  post,
  rootStream,
  count,
  aggregateStream,
  createBlock,
};
