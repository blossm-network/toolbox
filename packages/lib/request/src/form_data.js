import { basename } from "node:path";
import { addAbortSignal, Readable } from "node:stream";
import deps from "../deps.js";

export default async (fields, signal) => {
  signal.throwIfAborted();
  const form = new FormData();
  for (const [name, field] of Object.entries(fields)) {
    signal.throwIfAborted();
    const { value, options = {} } =
      field && typeof field === "object" && "value" in field
        ? field
        : { value: field };
    let body = value;
    let filename = options.filename;
    if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
      body = new Blob([value], { type: options.contentType });
    } else if (
      value?.path &&
      value.pending &&
      !value.readableEncoding &&
      value.bytesRead === 0
    ) {
      filename = filename || basename(value.path.toString());
      value.destroy();
      const file = await deps.openAsBlob(value.path, {
        type: options.contentType,
      });
      body = file.slice(
        value.start || 0,
        Number.isFinite(value.end) ? value.end + 1 : undefined,
        options.contentType
      );
    } else if (value && typeof value[Symbol.asyncIterator] === "function") {
      // File streams use openAsBlob above; arbitrary multipart streams are buffered.
      const input = addAbortSignal(
        signal,
        value instanceof Readable
          ? value
          : Readable.from(value, { objectMode: false })
      );
      let onAbort;
      const aborted = new Promise((resolve, reject) => {
        onAbort = () => reject(signal.reason);
        signal.addEventListener("abort", onAbort, { once: true });
      });
      try {
        body = await Promise.race([new Response(input).blob(), aborted]);
      } finally {
        signal.removeEventListener("abort", onAbort);
      }
    }
    signal.throwIfAborted();
    if (body instanceof Blob) {
      if (options.contentType && body.type !== options.contentType)
        body = body.slice(0, body.size, options.contentType);
      form.append(name, body, filename || "blob");
    } else {
      form.append(name, String(body));
    }
  }
  return form;
};
