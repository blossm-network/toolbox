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
      (err, response, body) =>
        err
          ? reject(err)
          : resolve({
            headers: response.headers,
            statusCode: response.statusCode,
            statusMessage: response.statusMessage,
            body
          })
    )
  );

exports.get = (url, params, headers) => {
  const options = {
    url: addParamsToUrl(url, params),
    headers
  };
  return new Promise((resolve, reject) =>
    deps.request(options, (err, response, body) =>
      err
        ? reject(err)
        : resolve({
          headers: response.headers,
          statusCode: response.statusCode,
          statusMessage: response.statusMessage,
          body
        })
    )
  );
};
