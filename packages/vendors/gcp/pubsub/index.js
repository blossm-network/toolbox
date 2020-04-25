const { PubSub } = require("@google-cloud/pubsub");
const pubsub = new PubSub();

exports.publish = async (data, topic) => {
  const string = JSON.stringify(data);
  const buffer = Buffer.from(string);
  return pubsub.topic(topic).publish(buffer);
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

exports.create = async (name) => {
  const topic = pubsub.topic(name);
  const [exists] = await topic.exists();
  if (exists) return;
  await topic.create();
};

exports.delete = async (name) => {
  const topic = pubsub.topic(name);
  const [exists] = await topic.exists();
  if (!exists) return;
  await topic.delete();
};

exports.exists = async (name) => {
  const topic = pubsub.topic(name);
  const [exists] = await topic.exists();
  return exists;
};
