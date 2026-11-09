import crypto from "crypto";
import deps from "./deps.js";

const publicKeys = new Map();
const FIVE_MINUTES = 5 * 60 * 1000;
const MAX_CACHED_KEYS = 100;

export default ({
    url,
    algorithm = "SHA256",
    cacheMilliseconds = FIVE_MINUTES,
  }) =>
  async ({ message, signature }) => {
    let cached = publicKeys.get(url);
    if (!cached || Date.now() - cached.fetchedAt >= cacheMilliseconds) {
      const response = await deps.get(url);
      const { key } = JSON.parse(response.body);
      cached = { key, fetchedAt: Date.now() };
      publicKeys.delete(url);
      if (publicKeys.size >= MAX_CACHED_KEYS)
        publicKeys.delete(publicKeys.keys().next().value);
      publicKeys.set(url, cached);
    }

    return crypto
      .createVerify(algorithm)
      .update(message)
      .verify(cached.key, signature, "base64");
  };
