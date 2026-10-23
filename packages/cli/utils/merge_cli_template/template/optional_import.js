import { access } from "fs/promises";

// Only an absent optional file disables a hook. A present module's syntax,
// initialization and nested dependency errors must stop startup.
export default async (url) => {
  try {
    await access(url);
  } catch (err) {
    if (err.code === "ENOENT") return undefined;
    throw err;
  }
  return (await import(url)).default;
};
