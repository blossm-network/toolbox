/**
 * This file is optional. Get rid of the leading underscore _ from the file's name to require it.
 * It can be used to customize your get queries to the view store.
 *
 * - Sorting
 * - MongoDB query syntax
 *
 * The function takes in the query params from the request (req.query),
 * and is responsible for returning { query, sort }, where
 * query is the query to be executed against the view store, formatted as a MongoDB query.
 *
 * and sort is the specification of how the results should be sorted, formatted as an array of MongoDB s.
 * sort is optional.
 *
 */

module.exports = ({ query, context }) => {
  return {
    name: query.firstName + query.lastName,
    identity: context.identity
  };
};
