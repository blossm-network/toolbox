/**
 * This file is required.
 *
 * Specifies the priviledge to access this service.
 *
 * The function takes in the path that the action and domain
 * that is being issued.
 * It is responsible for returning an array of priviledges that the
 * command requires.
 */

module.exports = async ({ path }) => {
  //eslint-disable-next-line no-console
  console.log("Do something with: ", { path });
  const pathParts = path.split("/");
  const action = pathParts[pathParts.length - 1];
  switch (action) {
  case "answer":
    return ["answer"];
  }
};
