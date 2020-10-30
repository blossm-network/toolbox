module.exports = (update, query, matchDelimiter) => {
  //TODO
  console.log({ update: JSON.stringify(update), query: JSON.stringify(query) });

  //sort array properties first
  update = {
    ...Object.keys(update)
      // .sort((a) => (update[a] instanceof Array ? -1 : 1))
      .sort((a, b) => (a.split(".").length > b.split(".").length ? 1 : -1))
      .reduce(
        (result, key) => ({
          ...result,
          [key]: update[key],
        }),
        {}
      ),
  };

  //TODO
  console.log({ update2: JSON.stringify(update) });

  const result = {};

  const matchUpdates = [];

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

  console.log({ matchUpdates });
  for (const matchUpdate of matchUpdates) {
    const propertySplit = matchUpdate.root.split(".");

    if (result[matchUpdate.root] != undefined) {
      result[matchUpdate.root] = result[matchUpdate.root].map((element) => ({
        ...element,
        [matchUpdate.key]: matchUpdate.value,
      }));
      continue;
    }
    //Supports max 2 layers.
    else if (
      propertySplit.length > 1 &&
      result[propertySplit[0]] != undefined
    ) {
      result[propertySplit[0]] = result[propertySplit[0]].map(
        (outerElement) => ({
          ...outerElement,
          [propertySplit[1]]: outerElement[propertySplit[1]].map((element) => ({
            ...element,
            [matchUpdate.key]: matchUpdate.value,
          })),
        })
      );
      continue;
    }

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
      propertySplit.length > 1 &&
      matchUpdates.some((mu) => {
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
      const key = `${propertySplit[0]}${matchDelimiter}${propertySplit[1]}`;
      result[key] = result[key].map((element) => {
        for (const param of relevantQueryParams)
          if (element[param.key] != param.value) return element;

        return {
          ...element,
          [matchUpdate.key]: matchUpdate.value,
        };
      });
    } else {
      result[`${matchUpdate.root}${matchDelimiter}${matchUpdate.key}`] =
        matchUpdate.value;
    }
  }

  return result;
};
