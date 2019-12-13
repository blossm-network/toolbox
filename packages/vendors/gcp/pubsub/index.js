const { PubSub } = require("@google-cloud/pubsub");
const pubsub = new PubSub();

exports.publish = async data => {
  if (data.payload == undefined) data.payload = {};

  //eslint-disable-next-line
  console.log("publishing: ", { topic: data.headers.topic, data });
  const string = JSON.stringify(data);
  const buffer = Buffer.from(string);

  const id = await pubsub.topic(data.headers.topic).publish(buffer);

  return id;
};

exports.subscribe = async ({ topic, name, fn }) => {
  const subscription = pubsub.topic(topic).subscription(name);
  const [exists] = await subscription.exists();
  if (exists) await subscription.delete();
  subscription.create(fn);
};

exports.unsubscribe = async ({ topic, name }) => {
  const subscription = pubsub.topic(topic).subscription(name);
  const [exists] = await subscription.exists();
  //eslint-disable-next-line
  console.log("unsub exists: ", exists);
  if (!exists) return;
  await subscription.delete();
};

exports.create = async name => {
  //eslint-disable-next-line
  console.log("3.1");
  const topic = pubsub.topic(name);
  //eslint-disable-next-line
  console.log("3.2");
  const [exists] = await topic.exists();
  //eslint-disable-next-line
  console.log("3.3: ", exists);
  if (exists) return;
  //eslint-disable-next-line
  console.log("3.4");
  await topic.create();
  //eslint-disable-next-line
  console.log("3.5");
};

exports.delete = async name => {
  const topic = pubsub.topic(name);
  const [exists] = await topic.exists();
  if (!exists) return;
  await topic.delete();
};
