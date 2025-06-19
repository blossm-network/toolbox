/**
 * This file is optional. Get rid of the leading underscore _ from the file's name to require it.
 * It can be used to customize your validator script.
 *
 * By default, validation follows the rules defined in your blossm.yaml 'payload' definition.
 * If this validate.js file is active it will override the blossm.yaml validation specs.
 *
 */

import { findError, string } from "@blossm/validator";

export default (payload) => {
  const error = findError([
    string(payload.onomonopeoa, {
      title: "onomonopeoa",
      path: "payload.onomonopeoa",
    }),
  ]);
  if (error) throw error;
};
