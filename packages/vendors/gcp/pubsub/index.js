const { PubSub } = require("@google-cloud/pubsub");
const pubsub = new PubSub();

exports.publish = async data => {
  if (data.payload == undefined) data.payload = {};

  const string = JSON.stringify(data);
  const buffer = Buffer.from(string);

  const id = await pubsub.topic(data.fact.topic).publish(buffer);

  return id;
};

exports.subscribe = async ({ topic, name, fn }) => {
  const subscription = pubsub.topic(topic).subscription(name);
  subscription.create(fn);
};

exports.create = async name => {
  const topic = pubsub.topic(name);
  return await topic.create();
};
