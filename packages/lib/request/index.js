const deps = require("./deps");
const addParamsToUrl = require("./src/add_params_to_url");

exports.post = async (url, params, headers) =>
  new Promise((resolve, reject) =>
    deps.request(
      {
        url,
        method: "POST",
        json: params,
        ...(headers != undefined && { headers })
      },
      (err, _, body) => (err ? reject(err) : resolve(body))
    )
  );

exports.get = (url, params) =>
  new Promise((resolve, reject) =>
    deps.request(addParamsToUrl(url, params), (err, _, body) =>
      err ? reject(err) : resolve(body)
    )
  );
