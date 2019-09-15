module.exports = results => {
  for (let i = 0; i < results.length; i++) {
    let result = results[i];
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
