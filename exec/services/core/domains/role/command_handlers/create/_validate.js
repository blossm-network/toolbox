/**
 * This file is optional. Get rid of the leading underscore _ from the file's name to require it.
 * It can be used to customize your validator script.
 *
 * By default, validation follows the rules defined in your blossm.yaml 'payload' definition.
 * If this file is active it will override the blossm.yaml validation specs.
 *
 */

const { findError, string } = require("@blossm/validator");

module.exports = payload => {
  const error = findError([
    string(payload.name, { title: "name", path: "payload.name" })
  ]);
  if (error) throw error;
};
