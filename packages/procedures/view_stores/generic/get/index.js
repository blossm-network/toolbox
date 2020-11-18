const deps = require("./deps");

const defaultQueryFn = (query) => query;
const defaultSortFn = (sort) => sort;
const defaultLimit = 50;

//Returns at most one value of a given key in an object.
const getValue = (object, key) => {
  const keyParts = key.split(".");
  return keyParts.length > 1
    ? object[keyParts[0]] instanceof Array
      ? object[keyParts[0]].map((element) =>
          getValue(element, keyParts.slice(1).join("."))
        )[0]
      : getValue(object[keyParts[0]], keyParts.slice(1).join("."))
    : object[keyParts[0]];
};

module.exports = ({
  findFn,
  countFn,
  one = false,
  group,
  formatFn,
  emptyFn,
  queryFn = defaultQueryFn,
  sortFn = defaultSortFn,
  formatCsvFn,
  groupsLookupFn,
  updateKeys,
}) => {
  return async (req, res) => {
    if (
      process.env.CONTEXT &&
      (!req.query.context || !req.query.context[process.env.CONTEXT])
    )
      throw deps.forbiddenError.message("This context is forbidden.", {
        info: {
          context: req.query.context,
        },
      });

    if (
      req.query.bootstrap &&
      (!process.env.BOOTSTRAP_CONTEXT ||
        !req.query.context[process.env.BOOTSTRAP_CONTEXT])
    )
      throw deps.forbiddenError.message("There isn't a context to bootstrap.");

    const bootstrap = req.query.bootstrap && process.env.BOOTSTRAP_CONTEXT;

    if (
      group &&
      (!req.query.context || !req.query.context.principal) &&
      !bootstrap
    )
      throw deps.forbiddenError.message("This request is missing a context.");

    const queryBody = queryFn(req.query.query || {});
    const formattedQueryBody = {};
    for (const key in queryBody)
      formattedQueryBody[`body.${key}`] = queryBody[key];

    const principalGroups =
      group &&
      !bootstrap &&
      (await groupsLookupFn({
        token: req.query.token,
      }));

    const query = {
      ...(!bootstrap && { ...formattedQueryBody }),
      ...(req.params.id && { "headers.id": req.params.id }),
      ...(bootstrap && {
        "headers.id": req.query.context[process.env.BOOTSTRAP_CONTEXT].root,
      }),
      ...(process.env.CONTEXT && {
        "headers.context": {
          root: req.query.context[process.env.CONTEXT].root,
          domain: process.env.CONTEXT,
          service: req.query.context[process.env.CONTEXT].service,
          network: req.query.context[process.env.CONTEXT].network,
        },
      }),
      ...(principalGroups && {
        "headers.groups": {
          $elemMatch: {
            $in: principalGroups,
          },
        },
      }),
    };

    const sortBody = sortFn(req.query.sort);
    let formattedSort;
    if (!bootstrap) {
      if (req.query.limit) req.query.limit = parseInt(req.query.limit);
      if (req.query.skip) req.query.skip = parseInt(req.query.skip);
      if (sortBody) {
        formattedSort = {};
        for (const key in sortBody) {
          formattedSort[`body.${key}`] = parseInt(sortBody[key]);
        }
      }
    }

    const limit = one || bootstrap ? 1 : req.query.limit || defaultLimit;
    const skip = one || bootstrap ? 0 : req.query.skip || 0;

    const [results, count] = await Promise.all([
      findFn({
        query,
        limit,
        skip,
        ...(req.query.text && { text: req.query.text }),
        ...(formattedSort && { sort: formattedSort }),
      }),
      ...(one || bootstrap
        ? []
        : [
            countFn({ query, ...(req.query.text && { text: req.query.text }) }),
          ]),
    ]);

    if (formatCsvFn) {
      const { data, fields } = formatCsvFn(results);
      const csv = deps.jsonToCsv({ data, fields });
      res.writeHead(200, {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=transactions.csv",
      });
      res.end(csv);
      return;
    }

    const updateKey =
      updateKeys &&
      req.query.query &&
      Object.keys(req.query.query).find((key) => updateKeys.includes(key));

    const updates = `https://updates.${
      process.env.BASE_NETWORK
    }/channel?query%5Bname%5D=${process.env.NAME}${
      process.env.CONTEXT ? `&query%5Bcontext%5D=${process.env.CONTEXT}` : ""
    }&query%5Bnetwork%5D=${process.env.NETWORK}${
      //TODO write better tests for this.
      //If there's only one result, use it's updateKey value.
      //If there's more than one result, use the first element's value if the updateKey was queried for.
      updateKey &&
      ((results.length > 1 &&
        (req.query.query || {})[updateKey] != undefined) ||
        results.length == 1)
        ? `&query%5Bkey%5D=${getValue(results[0].body, updateKey)}`
        : ""
    }${
      !process.env.CONTEXT && req.query.context && req.query.context.principal
        ? `&query%5Bprincipal%5D=${req.query.context.principal.root}`
        : ""
    }`;

    const formattedResults = results.map((r) => {
      const formattedTrace = [];
      for (const service in r.trace) {
        for (const domain in r.trace[service]) {
          for (const txId of r.trace[service][domain])
            if (!formattedTrace.includes(txId)) formattedTrace.push(txId);
        }
      }

      return {
        ...formatFn({
          body: r.body,
          id: r.headers.id,
          created: r.headers.created,
          modified: r.headers.modified,
        }),
        headers: {
          trace: formattedTrace,
          id: r.headers.id,
          context: r.headers.context,
          ...(r.headers.groups && { groups: r.headers.groups }),
        },
      };
    });

    if (!one && !bootstrap) {
      const limit = req.query.limit || defaultLimit;
      const url = `https://v${
        process.env.CONTEXT ? `.${process.env.CONTEXT}` : ``
      }.${process.env.NETWORK}/${process.env.NAME}`;
      const next =
        formattedResults.length == limit && skip + limit < count
          ? deps.urlEncodeQueryData(url, {
              ...(req.query.query && {
                query: req.query.query,
              }),
              ...(req.query.sort && {
                sort: req.query.sort,
              }),
              skip: skip + limit,
              limit,
            })
          : null;

      res.send({
        content:
          formattedResults.length == 0 && emptyFn
            ? emptyFn(queryBody)
            : formattedResults,
        updates,
        ...(next && { next }),
        count,
      });
    } else if (formattedResults.length > 0) {
      res.send({
        content: formattedResults[0],
        updates,
      });
    } else {
      throw deps.resourceNotFoundError.message("This view wasn't found.");
    }
  };
};
