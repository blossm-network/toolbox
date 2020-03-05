const deps = require("./deps");
const addParamsToUrl = require("./src/add_params_to_url");

const common = async ({ method, url, params, headers }) =>
  new Promise((resolve, reject) =>
    deps.request(
      {
        url,
        method,
        ...(params != undefined && { json: params }),
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

exports.post = async (url, { body, headers } = {}) =>
  await common({ method: "POST", url, params: body, headers });

exports.put = async (url, { body, headers } = {}) =>
  await common({ method: "PUT", url, params: body, headers });

exports.delete = async (url, { headers } = {}) =>
  await common({ method: "DELETE", url, headers });

exports.get = async (url, { query, headers } = {}) =>
  await common({ method: "GET", url: addParamsToUrl(url, query), headers });

exports.stream = async (url, onData, { query, headers } = {}) =>
  new Promise((resolve, reject) =>
    deps
      .request({
        url: addParamsToUrl(url, query),
        method: "GET",
        ...(headers != undefined && { headers })
      })
      .on("data", onData)
      .on("error", reject)
      .on("end", resolve)
  );
