const { PubSub } = require("@google-cloud/pubsub");
const pubsub = new PubSub();

exports.publish = async data => {
  if (data.payload == undefined) data.payload = {};

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
  if (!exists) return;
  await subscription.delete();
};

exports.create = async name => {
  //eslint-disable-next-line
  console.log("creating topic: ", name);
  const topic = pubsub.topic(name);
  //eslint-disable-next-line
  console.log("topic is: ", topic);
  const [exists] = await topic.exists();
  //eslint-disable-next-line
  console.log("exists: ", exists);
  if (exists) return;
  await topic.create();
  //eslint-disable-next-line
  console.log("dun: ", dun);
};

exports.delete = async name => {
  const topic = pubsub.topic(name);
  const [exists] = await topic.exists();
  if (!exists) return;
  await topic.delete();
};
