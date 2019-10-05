const deps = require("./deps");
const { notFound } = require("@sustainers/errors");

const defaultFn = query => {
  const querySort = query && query.sort;
  delete query.sort;
  delete query.context;
  return { query, sort: querySort };
};

module.exports = ({ store, fn = defaultFn }) => {
  return async (req, res) => {
    //eslint-disable-next-line no-console
    console.log("req.query: ", {
      query: req.query,
      body: req.body,
      params: req.params
    });

    const { query, sort } = fn(req.query);

    //eslint-disable-next-line no-console
    console.log("stuff: ", {
      query,
      sort
    });

    if (req.params.id == undefined) {
      const results = await deps.db.find({
        store,
        query: {
          ...query,
          ...(req.params.id && { id: req.params.id })
        },
        ...(sort && { sort }),
        options: {
          lean: true
        }
      });

      //eslint-disable-next-line no-console
      console.log("more stuff: ", {
        results,
        query: {
          ...query,
          ...(req.params.id && { id: req.params.id })
        },
        ...(sort && { sort }),
        options: {
          lean: true
        }
      });

      res.send(results);
    } else {
      const result = await deps.db.findOne({
        store,
        query: {
          ...(req.params.id && { id: req.params.id })
        },
        options: {
          lean: true
        }
      });

      if (!result) throw notFound.root;
      res.send(result);
    }
  };
};
