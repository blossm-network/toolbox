module.exports = (err) =>
  err && err.body && err.body._embedded && err.body._embedded.errors
    ? {
        errors: err.body._embedded.errors.map((error) => {
          return {
            message: error.message,
            path: error.path
              .split("/")
              .filter((part) => part.length > 1)
              .join("."),
          };
        }),
      }
    : undefined;
