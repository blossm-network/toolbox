/**
 * This file is optional. Get rid of the leading underscore _ from the file's name to require it.
 * It can be used to customize your put parameters to the view store.
 *
 * - MongoDB update syntax
 *
 * The function takes in the body params from the request (req.body),
 * and is responsible for returning an object to use as
 * the data to put in the view store, formatted as a MongoDB update.
 *
 * The body parameter contains req.body.context and req.body.view.
 *
 */

// module.exports = body => {
//   // body.context is the context
//   return {
//     $set: {
//       name: body.view.firstName + body.view.lastName
//     },
//     $addToSet: {
//       things: body.context.thing
//     }
//   };
// };
