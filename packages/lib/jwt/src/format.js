export const joseFormat = (format) => {
  if (format != "legacy" && format != "jose")
    throw new RangeError("Unsupported token format.");
  return format == "jose";
};

export default ({ format, algorithm }) => {
  const jose = joseFormat(format);
  if (jose && !["ES256", "ES384", "ES512"].includes(algorithm))
    throw new RangeError("Unsupported JOSE signing algorithm.");
  return jose;
};
