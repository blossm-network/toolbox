const deps = require("./deps");
const addParamsToUrl = require("./src/add_params_to_url");

exports.post = async (url, params, headers) =>
  await deps.request(url, {
    method: "POST",
    data: params,
    ...(headers != undefined && { headers })
  });

exports.get = async (url, params) =>
  await deps.request(addParamsToUrl(url, params));
