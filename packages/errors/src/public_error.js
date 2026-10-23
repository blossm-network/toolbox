// Only application-facing fields belong in an HTTP error. Diagnostic info and
// causes can contain credentials, request bodies and vendor responses.
export default (error = {}) => {
  const statusCode = error.statusCode || 500;
  const serverError = statusCode >= 500;
  const info = typeof error.info == "function" ? error.info() : error.info;
  return {
    statusCode,
    code: serverError
      ? "InternalServer"
      : (error.body && error.body.code) || error.code,
    message: serverError ? "An internal server error occurred." : error.message,
    info: {
      ...(!serverError &&
        info &&
        typeof info.redirect == "string" && { redirect: info.redirect }),
      ...(!serverError &&
        info &&
        Array.isArray(info.errors) && {
          errors: info.errors
            .filter((error) => error && typeof error == "object")
            .map(({ message, path }) => ({
              ...(typeof message == "string" && { message }),
              ...(typeof path == "string" && { path }),
            })),
        }),
    },
  };
};
