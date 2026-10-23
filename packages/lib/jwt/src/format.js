export default ({ format, algorithm }) => {
  if (format != "legacy" && format != "jose")
    throw new RangeError("Unsupported token format.");
  const jose = format == "jose";
  if (jose && !["ES256", "ES384", "ES512"].includes(algorithm))
    throw new RangeError("Unsupported JOSE signing algorithm.");
  return jose;
};
