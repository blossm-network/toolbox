/**
 *
 * This file is required.
 * Specify how each event added to the store should modify the aggregate.
 *
 * Each handler takes in the current state of the aggregate and the event's payload,
 * and is responsible for returning the updated state.
 *
 * If a handler is not specified for an event that's being added, it will fail.
 *
 */

export default {
  chirp: (state, payload) => ({
    ...state,
    ...payload
  }),
};
