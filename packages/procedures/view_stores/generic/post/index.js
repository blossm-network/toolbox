// const deps = require("./deps");

// const defaultFn = body => body.view;

module.exports = () => {
  //({ writeFn, dataFn = defaultFn }) => {
  return async (req, res) => {
    // const id = deps.uuid();

    // const now = deps.dateString();

    // const customData = dataFn(req.body.view);

    // const data = {
    //   ...customData,
    //   headers: {
    //     id,
    //     modified: now,
    //     created: now
    //   }
    // };

    // await writeFn({
    //   id,
    //   data
    // });

    res.status(200).send(); //{ id });
  };
};
