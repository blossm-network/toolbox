module.exports = req => {
  const host = req.get("host");
  const subdomains = host.split(".");
  if (subdomains.length > 1 && subdomains[1] == "command") return subdomains[0];
  return null;
};
