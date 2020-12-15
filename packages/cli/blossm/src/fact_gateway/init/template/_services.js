/**
 * This file is optional. Remove the underline from the name if it should be included.
 * By default, gateways forward request to be serviced by other fact procedures.
 * In the case where the gateway should service the request itself, define the service here.
 * If the service is not specified here, it will be forwarded.
 *
 * The function takes in the req and res directly
 * and is in charge of fully executing the specifications of the request.
 */

module.exports = {
  "some-name": (req, res) => {
    res.status(200).send("ok!");
  },
};
