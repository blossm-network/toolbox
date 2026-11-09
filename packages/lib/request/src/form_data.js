import { basename } from "node:path";
import { addAbortSignal, Readable } from "node:stream";
import deps from "../deps.js";

export default async (fields, signal) => {
  const entries = Object.entries(fields).map(([name, field]) => ({
    name,
    ...(field && typeof field === "object" && "value" in field
      ? field
      : { value: field }),
  }));
  const closeInputs = () => {
    for (const { value } of entries) {
      if (
        value &&
        typeof value.destroy === "function" &&
        !value.readableEnded &&
        !value.destroyed
      )
        value.destroy();
    }
  };
  signal.addEventListener("abort", closeInputs, { once: true });
  try {
    signal.throwIfAborted();
    const form = new FormData();
    for (const { name, value, options = {} } of entries) {
      signal.throwIfAborted();
      let body = value;
      const filename =
        options.filename || (value?.path && basename(value.path.toString()));
      if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
        body = new Blob([value], { type: options.contentType });
      } else if (
        value?.path &&
        value.pending &&
        !value.readableEncoding &&
        value.bytesRead === 0
      ) {
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
  } finally {
    signal.removeEventListener("abort", closeInputs);
    closeInputs();
  }
};
