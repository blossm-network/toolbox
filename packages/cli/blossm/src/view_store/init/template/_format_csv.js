/**
 * This file is optional. Get rid of the leading underscore _ from the file's name to require it.
 * It can be used to turn data into a csv.
 *
 * Export an object whose fn formats one stored view body into a CSV row.
 * The fields array specifies the columns to include.
 *
 * The function must be deterministic, meaning the output should always be the same for every input.
 */

// export default {
// fn: (view) => ({
//   name: view.name,
// }),
// fields: ["name"],
// };

export default { fn: (view) => ({ name: view.name }), fields: ["name"] };
