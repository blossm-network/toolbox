module.exports = req => {
  const host = req.get("host");
  const subdomains = host.split(".");

  if (subdomains.length <= 3) return {};

  return {
    action: subdomains[0],
    domain: subdomains[1],
    service: subdomains[2]
  };
};
