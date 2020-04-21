/**
 * This file is required.
 *
 * Specifies the reaction logic.
 *
 * The function takes in the payload param from the request (req.body.payload).
 * It is not responsible for returning anything.
 *
 */

//const deps = require("./deps");

module.exports = async (event) => {
  //eslint-disable-next-line no-console
  console.log("Do something with: ", { event });
};
