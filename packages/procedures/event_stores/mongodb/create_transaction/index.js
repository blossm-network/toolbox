import deps from "./deps.js";

export default async (fn) => {
  if (process.env.NODE_ENV == "local") return await fn();
  const session = await deps.db.startSession();
  let result;
  await session.withTransaction(async () => {
    result = await fn(session);
  });
  await session.endSession();
  return result;
};
