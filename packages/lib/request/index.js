const request = require("async-request");

const addParamsToUrl = require("./src/add_params_to_url");

exports.post = async (url, params, headers) =>
  await request(url, { method: "POST", data: params, headers });

exports.get = async (url, params) => await request(addParamsToUrl(url, params));
