import deps from "./deps.js";
import jsonDecoder from "./src/json_decoder.js";
import formDataBody from "./src/form_data.js";
import {
  chunks,
  failure,
  metadata,
  open,
  parse,
  read,
  signalFor,
  timed,
} from "./src/response.js";

const contextFor = ({ signal, timeout = 30000 } = {}) => {
  const controller = new AbortController();
  return { controller, signal: signalFor(controller, signal), timeout };
};

const common = async ({
  method,
  url,
  body,
  headers,
  formData,
  signal,
  timeout,
}) => {
  const context = contextFor({ signal, timeout });
  try {
    if (formData === undefined) context.signal.throwIfAborted();
    const requestHeaders = new Headers(headers);
    if (formData !== undefined && body !== undefined)
      throw new TypeError("Use either body or formData for an HTTP request.");
    let requestBody;
    if (formData !== undefined)
      requestBody = await timed(
        () => formDataBody(formData, context.signal),
        context.controller,
        context.timeout
      );
    else if (body !== undefined) {
      requestBody = JSON.stringify(body);
      if (!requestHeaders.has("content-type"))
        requestHeaders.set("content-type", "application/json");
      if (!requestHeaders.has("accept"))
        requestHeaders.set("accept", "application/json");
    }
    const response = await open({
      method,
      url,
      headers: requestHeaders,
      body: requestBody,
      ...context,
    });
    const responseBody = await read(response, context);
    return {
      ...metadata(response),
      body: body !== undefined ? parse(responseBody) : responseBody,
    };
  } finally {
    context.controller.abort();
  }
};

const post = (url, options = {}) => common({ method: "POST", url, ...options });
const put = (url, options = {}) => common({ method: "PUT", url, ...options });
const del = (url, { query, ...options } = {}) =>
  common({
    method: "DELETE",
    url: deps.urlEncodeQueryData(url, query),
    ...options,
  });
const get = (url, { query, ...options } = {}) =>
  common({
    method: "GET",
    url: deps.urlEncodeQueryData(url, query),
    ...options,
  });

async function* records(
  { url, query, headers, onResponseFn, decode },
  context
) {
  const response = await open({
    url: deps.urlEncodeQueryData(url, query),
    headers,
    ...context,
  });
  if (response.status >= 300) throw await failure(response, context);
  if (onResponseFn) await onResponseFn(metadata(response));
  const decoder = decode?.();
  for await (const chunk of chunks(response, context)) {
    if (decoder) yield* decoder.write(chunk);
    else yield chunk;
  }
  if (decoder) yield* decoder.end();
}

const stream = async (url, onDataFn, options = {}) => {
  const context = contextFor(options);
  try {
    for await (const value of records({ url, ...options }, context)) {
      context.signal.throwIfAborted();
      await onDataFn(value);
    }
  } finally {
    context.controller.abort();
  }
};

const streamMany = async (requests, onDataFn, sortFn, options = {}) => {
  const context = contextFor(options);
  const iterators = requests.map((request) =>
    records(
      { ...options, ...request },
      {
        ...context,
        timeout: request.timeout ?? context.timeout,
        signal: signalFor(context.controller, request.signal, options.signal),
      }
    )
  );
  try {
    const heads = await Promise.all(
      iterators.map((iterator) => iterator.next())
    );
    while (true) {
      context.signal.throwIfAborted();
      let selected = -1;
      for (let i = 0; i < heads.length; i++) {
        if (
          !heads[i].done &&
          (selected === -1 ||
            (sortFn && sortFn(heads[i].value, heads[selected].value) < 0))
        )
          selected = i;
      }
      if (selected === -1) return;
      await onDataFn(heads[selected].value);
      heads[selected] = await iterators[selected].next();
    }
  } finally {
    context.controller.abort();
    await Promise.allSettled(iterators.map((iterator) => iterator.return()));
  }
};

export default { post, put, del, get, stream, streamMany, jsonDecoder };
