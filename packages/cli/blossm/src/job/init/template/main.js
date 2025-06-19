/**
 * This file is required.
 *
 * Specifies the job logic.
 *
 * The function takes in the payload param from the request (req.body.payload).
 * It is not responsible for returning anything.
 *
 */

//import deps from "./deps.js";

export default async ({ payload }) => {
  //eslint-disable-next-line no-console
  console.log("Do something with: ", { payload });
};
