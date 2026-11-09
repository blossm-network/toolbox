// The factory stores explicitly public metadata independently of SDK cause merging.
// Native error properties, stacks and causes are not response fields.
export default (error = {}) => {
  const statusCode = error.statusCode || 500;
  const declared = Object.hasOwn(error, "publicInfo");
  const nativeServerError = statusCode >= 500 && !declared;
  return {
    statusCode,
    code: nativeServerError
      ? "InternalServer"
      : (error.body && error.body.code) || error.code,
    message: declared
      ? error.message
      : nativeServerError
      ? "An internal server error occurred."
      : "The request could not be processed.",
    info: declared ? error.publicInfo : {},
  };
};
