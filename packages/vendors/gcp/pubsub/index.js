import { PubSub } from "@google-cloud/pubsub";

export const __pubsub = new PubSub();

const publish = async (data, topic) => {
  const string = JSON.stringify(data);
  const buffer = Buffer.from(string);
  return __pubsub.topic(topic).publishMessage({ data:buffer });
};

const subscribe = async ({ topic, name, fn }) => {
  const subscription = __pubsub.topic(topic).subscription(name);
  const [exists] = await subscription.exists();
  if (exists) await subscription.delete();
  subscription.create(fn);
};

const unsubscribe = async ({ topic, name }) => {
  const subscription = __pubsub.topic(topic).subscription(name);
  const [exists] = await subscription.exists();
  if (!exists) return;
  await subscription.delete();
};

const create = async (name) => {
  const topic = __pubsub.topic(name);
  const [exists] = await topic.exists();
  if (exists) return;
  await topic.create();
};

const del = async (name) => {
  const topic = __pubsub.topic(name);
  const [exists] = await topic.exists();
  if (!exists) return;
  await topic.delete();
};

const exists = async (name) => {
  const topic = __pubsub.topic(name);
  const [exists] = await topic.exists();
  return exists;
};

export default {
  __pubsub,
  publish,
  subscribe,
  unsubscribe,
  create,
  del,
  exists,
};