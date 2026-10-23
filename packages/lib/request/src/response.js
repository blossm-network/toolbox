import deps from "../deps.js";

export const metadata = (response) => {
  const headers = Object.fromEntries(response.headers);
  const cookies = response.headers.getSetCookie();
  if (cookies.length) headers["set-cookie"] = cookies;
  return {
    headers,
    statusCode: response.status,
    statusMessage: response.statusText,
  };
};

export const timed = async (fn, controller, timeout) => {
  const timer = setTimeout(
    () =>
      controller.abort(
        new DOMException("The HTTP request timed out.", "TimeoutError")
      ),
    timeout
  );
  try {
    return await fn();
  } finally {
    clearTimeout(timer);
  }
};

export const signalFor = (controller, ...signals) =>
  AbortSignal.any([controller.signal, ...signals.filter(Boolean)]);

export const open = async ({
  url,
  method = "GET",
  headers,
  body,
  signal,
  controller,
  timeout,
}) => {
  let target = new URL(
    url.startsWith("http")
      ? url
      : `${process.env.NODE_ENV === "local" ? "http" : "https"}://${url}`
  );
  const requestHeaders = new Headers(headers);
  for (let redirects = 0; ; redirects++) {
    const response = await timed(
      () =>
        deps.fetch(target, {
          method,
          headers: requestHeaders,
          body,
          signal,
          redirect: "manual",
        }),
      controller,
      timeout
    );
    if (
      method !== "GET" ||
      ![301, 302, 303, 307, 308].includes(response.status) ||
      !response.headers.has("location")
    )
      return response;
    await response.body?.cancel();
    if (redirects === 5)
      throw new Error("The HTTP request exceeded five redirects.");
    const next = new URL(response.headers.get("location"), target);
    if (target.protocol === "https:" && next.protocol !== "https:")
      throw new Error("An HTTPS request cannot redirect to an insecure URL.");
    if (next.origin !== target.origin) {
      for (const name of ["authorization", "cookie", "proxy-authorization"])
        requestHeaders.delete(name);
    }
    target = next;
  }
};

export async function* chunks(response, { controller, signal, timeout }) {
  if (!response.body) return;
  const reader = response.body.getReader();
  try {
    while (true) {
      signal.throwIfAborted();
      const { value, done } = await timed(
        () => reader.read(),
        controller,
        timeout
      );
      if (done) return;
      yield Buffer.from(value);
    }
  } finally {
    try {
      await reader.cancel();
    } finally {
      reader.releaseLock();
    }
  }
}

export const read = async (response, context, maxBytes = Infinity) => {
  const parts = [];
  let size = 0;
  for await (const part of chunks(response, context)) {
    const remaining = maxBytes - size;
    parts.push(part.subarray(0, remaining));
    size += part.length;
    if (size >= maxBytes) break;
  }
  return Buffer.concat(parts).toString();
};

export const parse = (body) => {
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
};

export const failure = async (response, context) => {
  const body = parse(await read(response, context, 64 * 1024));
  return deps.constructError({
    statusCode: response.status,
    message: body?.message || `The HTTP request failed (${response.status}).`,
    code: body?.code,
    info: body?.info,
  });
};
