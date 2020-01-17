/**
 *
 * This file is required.
 * Specify how each event added to the store should modify the aggregate.
 *
 * Each handler takes in the current state of the aggregate and the event's payload.
 * They are responsible for returning the new state.
 *
 * If an handler is not specified for an event that's being added, it will fail.
 */

module.exports = {
  add: (state, payload) => {
    return {
      ...state,
      ...payload
    };
  },
  remove: (state, payload) => {
    return {
      ...state,
      ...payload
    };
  }
};
