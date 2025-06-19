import { PubSub } from "@google-cloud/pubsub";

export const __pubsub = new PubSub();

export const publish = async (data, topic) => {
  const string = JSON.stringify(data);
  const buffer = Buffer.from(string);
  return __pubsub.topic(topic).publishMessage({ data:buffer });
};

export const subscribe = async ({ topic, name, fn }) => {
  const subscription = __pubsub.topic(topic).subscription(name);
  const [exists] = await subscription.exists();
  if (exists) await subscription.delete();
  subscription.create(fn);
};

export const unsubscribe = async ({ topic, name }) => {
  const subscription = __pubsub.topic(topic).subscription(name);
  const [exists] = await subscription.exists();
  if (!exists) return;
  await subscription.delete();
};

export const create = async (name) => {
  const topic = __pubsub.topic(name);
  const [exists] = await topic.exists();
  if (exists) return;
  await topic.create();
};

export const del = async (name) => {
  const topic = __pubsub.topic(name);
  const [exists] = await topic.exists();
  if (!exists) return;
  await topic.delete();
};

export const exists = async (name) => {
  const topic = __pubsub.topic(name);
  const [exists] = await topic.exists();
  return exists;
};
