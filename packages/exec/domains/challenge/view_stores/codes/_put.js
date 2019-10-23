/**
 * This file is optional. Get rid of the leading underscore _ from the file's name to require it.
 * It can be used to customize your put parameters to the view store.
 *
 * - MongoDB update syntax
 *
 * The function takes in the body params from the request (req.body),
 * and is responsible for returning { update }, where
 * update is the data to put in the view store, formatted as a MongoDB update.
 *
 */

// module.exports = body => {
//   return {
//     $set: {
//       name: body.firstName + body.lastName
//     },
//     $addToSet: {
//       things: body.thing
//     }
//   };
// };
