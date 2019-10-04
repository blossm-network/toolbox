const { PubSub } = require("@google-cloud/pubsub");
const pubsub = new PubSub();

exports.publish = async event => {
  if (event.payload == undefined) event.payload = {};

  const data = JSON.stringify(event);
  const buffer = Buffer.from(data);

  const id = await pubsub.topic(event.fact.topic).publish(buffer);

  return id;
};
