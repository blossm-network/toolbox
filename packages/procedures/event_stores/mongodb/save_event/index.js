const deps = require("./deps");

const { preconditionFailed } = require("@blossm/errors");

module.exports = ({ eventStore }) => async event => {
  try {
    const [result] = await deps.db.create({
      store: eventStore,
      data: event
    });
    delete result._id;
    delete result.__v;
    return result;
  } catch (e) {
    if (e.code == "11000" && e.keyPattern.id == 1) {
      throw preconditionFailed.eventNumberDuplicate({
        info: { number: event.headers.number }
      });
    } else {
      throw e;
    }
  }
};
