/**
 * This file is optional. Get rid of the leading underscore _ from the file's name to require it.
 * It can be used to customize your get sorts to the view store.
 *
 * - Sorting
 * - MongoDB query syntax
 *
 * The function takes in req.query.sort and returns the MongoDB sort specification.
 *
 */

// export default (sort) => {
//   return { name: sort.name };
// };

export default (sort) => sort;
