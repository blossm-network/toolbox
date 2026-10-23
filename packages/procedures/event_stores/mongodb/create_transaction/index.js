import deps from "./deps.js";

export default async (fn) => {
  if (process.env.NODE_ENV == "local") return await fn();
  const session = await deps.db.startSession();
  let result;
  let failed = false;
  try {
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } catch (err) {
    failed = true;
    throw err;
  } finally {
    try {
      await session.endSession();
    } catch (err) {
      if (!failed) throw err;
    }
  }
};
