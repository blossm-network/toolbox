import deps from "./deps.js";

let client;

if (process.env.REDIS_HOST && process.env.REDIS_PORT) {
  client = deps.redis.createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
  });

  client.on("error", (error) => {
    console.error("Redis error", error);
  });
  client.on("connect", () => {
    console.log("Redis connected");
  });
  client.connect();
}

const fallbackObjectCache = new Map();

const writeObject = async (key, object) => {
  if (client && client.isReady) {
    await client.HSET(key, object);
  } else {
    const previous = fallbackObjectCache.get(key);
    fallbackObjectCache.set(key, {
      value: object,
      expiresAt:
        previous && previous.expiresAt > Date.now()
          ? previous.expiresAt
          : undefined,
    });
  }
};

const readObject = async (key) => {
  if (client && client.isReady) {
    return await client.HGETALL(key);
  }
  const entry = fallbackObjectCache.get(key);
  if (!entry) return;
  if (entry.expiresAt !== undefined && entry.expiresAt <= Date.now()) {
    fallbackObjectCache.delete(key);
    return;
  }
  return entry.value;
};

const setExpiry = async (key, { seconds }) => {
  if (client && client.isReady) {
    await client.EXPIRE(key, seconds);
  } else {
    const entry = fallbackObjectCache.get(key);
    if (
      entry &&
      (entry.expiresAt === undefined || entry.expiresAt > Date.now())
    ) {
      entry.expiresAt = Date.now() + seconds * 1000;
    } else {
      fallbackObjectCache.delete(key);
    }
  }
};

export default {
  writeObject,
  readObject,
  setExpiry,
};
