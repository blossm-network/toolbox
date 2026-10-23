import deps from "./deps.js";

export default async (fn) => {
  if (process.env.NODE_ENV == "local") return await fn();
  const session = await deps.db.startSession();
  let result;
  let cleanupFailed = false;
  let cleanupError;
  try {
    await session.withTransaction(async () => {
      result = await fn(session);
    });
  } finally {
    try {
      await session.endSession();
    } catch (err) {
      cleanupFailed = true;
      cleanupError = err;
    }
  }
  if (cleanupFailed) throw cleanupError;
  return result;
};
