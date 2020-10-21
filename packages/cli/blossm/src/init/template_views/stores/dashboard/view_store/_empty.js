/**
 * This file is optional. Get rid of the leading underscore _ from the file's name to require it.
 * It can be used to return a custom response if no views match a query.
 *
 * The function takes in the query that was issues,
 * and is responsible for returning a formatted empty view as it should be returned to the requester.
 *
 * The function must be deterministic, meaning the output should always be the same for every input.
 */

module.exports = ({ query }) => {
  return { body: query };
};
