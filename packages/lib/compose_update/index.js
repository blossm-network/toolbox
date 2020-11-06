//TODO this function is such a hack, but it works. It's also the reason projections are magic.

const composeUpdate = (update, query, matchDelimiter) => {
  //sort array properties first
  update = {
    ...Object.keys(update)
      .sort((a, b) => (a.split(".").length > b.split(".").length ? 1 : -1))
      .reduce(
        (result, key) => ({
          ...result,
          [key]: update[key],
        }),
        {}
      ),
  };

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

    if (result[matchUpdate.root] != undefined) {
      result[matchUpdate.root] = result[matchUpdate.root].map((element) => {
        for (const param of relevantQueryParams)
          if (
            element[param.key] != undefined &&
            element[param.key] != param.value
          )
            return element;

        return {
          ...element,
          [matchUpdate.key]: matchUpdate.value,
        };
      });
      continue;
    }
    //Supports max 2 layers.
    else if (
      propertySplit.length > 1 &&
      result[propertySplit[0]] instanceof Array
    ) {
      //TODO
      console.log({ k: result[propertySplit[0]] });
      result[propertySplit[0]] = result[propertySplit[0]].map(
        (outerElement) => {
          if (outerElement[propertySplit[1]] == undefined) return outerElement;
          return {
            ...outerElement,
            [propertySplit[1]]: outerElement[propertySplit[1]].map(
              (element) => {
                for (const param of relevantQueryParams)
                  if (
                    element[param.key] != undefined &&
                    element[param.key] != param.value
                  )
                    return element;
                return {
                  ...element,
                  [matchUpdate.key]: matchUpdate.value,
                };
              }
            ),
          };
        }
      );
      continue;
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

  // Combine objects if needed.
  for (const key in result) {
    const split = key.split(".");
    if (split.length <= 1) continue;
    const last = split.pop();
    const rootSplit = [...split];
    //pop removes the last element, so root is everything except last.
    let root = split.join(".");

    if (rootSplit.length > 1) {
      const rootRoot = rootSplit[0];
      if (
        result[rootRoot] != undefined &&
        typeof result[rootRoot] == "object"
      ) {
        result[rootRoot] = composeUpdate(
          {
            ...result[rootRoot],
            [`${rootSplit
              .join(".")
              .replace(`${rootRoot}.`, "")}.${last}`]: result[key],
          },
          {},
          matchDelimiter
        );
        delete result[key];
      }
    }
    if (
      result[root] != undefined &&
      !Object.keys(result[root]).some(
        (subkey) =>
          query[`${key}.${subkey}`] != undefined &&
          query[`${key}.${subkey}`] != result[root][subkey]
      )
    ) {
      if (result[key] === null) {
        result[root] = undefined;
      } else {
        result[root] = {
          ...result[root],
          [last]: result[key],
        };
      }
      delete result[key];
    }
  }

  return result;
};

module.exports = composeUpdate;
