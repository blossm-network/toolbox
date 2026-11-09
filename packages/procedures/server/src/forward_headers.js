// A proxy owns its connection framing and recalculates any transformed body size.
export default (headers = {}) => {
  const blocked = new Set([
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "content-length",
  ]);
  const connection = Object.entries(headers).find(
    ([name]) => name.toLowerCase() === "connection"
  )?.[1];
  for (const name of String(connection || "").split(","))
    blocked.add(name.trim().toLowerCase());
  return Object.fromEntries(
    Object.entries(headers).filter(([name]) => !blocked.has(name.toLowerCase()))
  );
};
