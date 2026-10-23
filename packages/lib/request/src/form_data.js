import { basename } from "node:path";
import deps from "../deps.js";

export default async (fields) => {
  const form = new FormData();
  for (const [name, field] of Object.entries(fields)) {
    const { value, options = {} } =
      field && typeof field === "object" && "value" in field
        ? field
        : { value: field };
    let body = value;
    let filename = options.filename;
    if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
      body = new Blob([value], { type: options.contentType });
    } else if (value?.path && typeof value.destroy === "function") {
      filename = filename || basename(value.path.toString());
      value.destroy();
      body = await deps.openAsBlob(value.path, { type: options.contentType });
    } else if (value && typeof value[Symbol.asyncIterator] === "function") {
      // File streams use openAsBlob above; arbitrary multipart streams are buffered.
      body = await new Response(value).blob();
    }
    if (body instanceof Blob) {
      form.append(name, body, filename || "blob");
    } else {
      form.append(name, String(body));
    }
  }
  return form;
};
