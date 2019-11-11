module.exports = results => {
  for (const result of results) {
    if (result == undefined) {
      continue;
    } else if (result.isValid != undefined) {
      if (!result.isValid()) return result.firstError();
    } else if (typeof result == "string") {
      return Error(result);
    } else if (result instanceof Error) {
      return result;
    }
  }
  return null;
};
