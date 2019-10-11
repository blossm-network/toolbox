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

exports.post = async (url, params, headers) =>
  await common({ method: "POST", url, params, headers });

exports.put = async (url, params, headers) =>
  await common({ method: "PUT", url, params, headers });

exports.delete = async (url, headers) =>
  await common({ method: "DELETE", url, headers });

exports.get = async (url, params, headers) =>
  await common({ method: "GET", url: addParamsToUrl(url, params), headers });

exports.stream = async (url, params, onResponse, headers) =>
  new Promise((resolve, reject) =>
    deps
      .request({
        url: addParamsToUrl(url, params),
        method: "GET",
        ...(headers != undefined && { headers })
      })
      .on("reponse", onResponse)
      .on("error", reject)
      .on("end", resolve)
  );
