// Preserve explicitly supplied public metadata independently of SDK cause merging.
export const publicInfo = new WeakMap();

// Only errors created by this package declare public application metadata.
// Native error properties, stacks and causes are not response fields.
export default (error = {}) => {
  const statusCode = error.statusCode || 500;
  const declared = publicInfo.has(error);
  const nativeServerError = statusCode >= 500 && !declared;
  return {
    statusCode,
    code: nativeServerError
      ? "InternalServer"
      : (error.body && error.body.code) || error.code,
    message: nativeServerError
      ? "An internal server error occurred."
      : error.message,
    info: declared ? publicInfo.get(error) : {},
  };
};
