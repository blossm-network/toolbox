const deps = require("./deps");

const common = async ({ method, url, params, headers }) =>
  new Promise((resolve, reject) => {
    //TODO
    console.log({ url });
    return deps.request(
      {
        url: url.startsWith("http")
          ? url
          : `${process.env.NODE_ENV == "local" ? "http" : "https"}://${url}`,
        method,
        ...(params != undefined && { json: params }),
        ...(headers != undefined && { headers }),
      },
      (err, response, body) =>
        err
          ? reject(err)
          : resolve({
              headers: response.headers,
              statusCode: response.statusCode,
              statusMessage: response.statusMessage,
              body,
            })
    );
  });

const jointStream = (streams, sortFn, onError) => {
  switch (streams.length) {
    case 1:
      streams[0].on("error", onError);
      return streams[0];
    case 2:
      streams[0].on("error", onError);
      streams[1].on("error", onError);
      return new deps.union(streams[0], streams[1], sortFn);
    default: {
      const half = Math.ceil(streams.length / 2);
      const firstHalf = streams.splice(0, half);
      const secondHalf = streams.splice(-half);
      return new deps.union(
        jointStream(firstHalf, sortFn, onError),
        jointStream(secondHalf, sortFn, onError),
        sortFn
      );
    }
  }
};

exports.post = async (url, { body, headers } = {}) =>
  await common({ method: "POST", url, params: body, headers });

exports.put = async (url, { body, headers } = {}) =>
  await common({ method: "PUT", url, params: body, headers });

exports.delete = async (url, { query, headers } = {}) =>
  await common({
    method: "DELETE",
    url,
    headers,
    params: { query },
  });

exports.get = async (url, { query, headers } = {}) =>
  await common({
    method: "GET",
    url: deps.urlEncodeQueryData(url, query),
    headers,
  });

exports.stream = async (url, onDataFn, { query, headers } = {}) => {
  let processingData = false;
  let finishedProcessingAllData = false;
  return new Promise((resolve, reject) =>
    deps
      .request({
        url: deps.urlEncodeQueryData(url, query),
        method: "GET",
        ...(headers != undefined && { headers }),
      })
      .on("data", async (data) => {
        processingData = true;
        await onDataFn(data);
        processingData = false;
        if (finishedProcessingAllData) resolve();
      })
      .on("error", reject)
      .on("end", () => {
        finishedProcessingAllData = true;
        if (!processingData) resolve();
      })
  );
};

exports.streamMany = async (requests, onDataFn, sortFn) => {
  const requestStreams = requests.map(({ url, query, headers }) =>
    deps.request({
      url: deps.urlEncodeQueryData(url, query),
      method: "GET",
      ...(headers != undefined && { headers }),
    })
  );

  let processingData = false;
  let finishedProcessingAllData = false;
  let rejected = false;

  return new Promise((resolve, reject) =>
    jointStream(requestStreams, sortFn, (err) => {
      reject(err);
      rejected = true;
    })
      .on("data", async (data) => {
        processingData = true;
        await onDataFn(data);
        processingData = false;
        if (!rejected && finishedProcessingAllData) resolve();
      })
      .on("error", reject)
      .on("end", () => {
        finishedProcessingAllData = true;
        if (!rejected && !processingData) resolve();
      })
  );
};
