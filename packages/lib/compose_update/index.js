module.exports = (update, query, matchDelimiter) => {
  const result = {};

  const matchUpdates = [];

  //sort array properties first
  update = {
    ...Object.keys(update)
      .sort((a) => (update[a] instanceof Array ? -1 : 1))
      .reduce(
        (result, key) => ({
          ...result,
          [key]: update[key],
        }),
        {}
      ),
  };

  for (const key in update) {
    const components = key.split(matchDelimiter);
    if (components.length > 1) {
      matchUpdates.push({
        root: components[0],
        key: components[1],
        value: update[key],
      });
    } else {
      result[key] = update[key];
    }
  }

  if (matchUpdates.length == 0) return result;

  for (const matchUpdate of matchUpdates) {
    let relevantQueryParams = [];
    for (const queryKey in query) {
      const querySplit = queryKey.split(`${matchUpdate.root}.`);
      if (querySplit.length > 1) {
        relevantQueryParams.push({
          key: querySplit[1],
          value: query[queryKey],
        });
      }
    }

    const propertySplit = matchUpdate.root.split(".");

    if (result[matchUpdate.root] instanceof Array) {
      result[matchUpdate.root] = result[matchUpdate.root].map((element) => {
        for (const param of relevantQueryParams)
          if (element[param.key] != param.value) return element;

        return {
          ...element,
          [matchUpdate.key]: matchUpdate.value,
        };
      });
    } else if (
      matchUpdates.some((mu) => {
        if (propertySplit.length < 2) return false;
        return (
          mu.root == propertySplit[0] &&
          mu.key == propertySplit[1] &&
          relevantQueryParams.some(
            (param) =>
              mu.value instanceof Array &&
              mu.value.some((e) => e[param.key] == param.value)
          )
        );
      })
    ) {
      result[
        `${propertySplit[0]}${matchDelimiter}${propertySplit[1]}`
      ] = result[`${propertySplit[0]}${matchDelimiter}${propertySplit[1]}`].map(
        (element) => {
          for (const param of relevantQueryParams)
            if (element[param.key] != param.value) return element;

          return {
            ...element,
            [matchUpdate.key]: matchUpdate.value,
          };
        }
      );
    } else {
      result[`${matchUpdate.root}${matchDelimiter}${matchUpdate.key}`] =
        matchUpdate.value;
    }
  }

  return result;
};
