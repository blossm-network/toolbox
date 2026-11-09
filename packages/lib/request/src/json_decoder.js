import { StringDecoder } from "node:string_decoder";

// HTTP chunk boundaries have no relationship to JSON record boundaries.
export default () => {
  const utf8 = new StringDecoder("utf8");
  let buffer = "";
  let index = 0;
  let start = -1;
  let depth = 0;
  let quoted = false;
  let escaped = false;

  const consume = (text) => {
    buffer += text;
    const values = [];
    let consumed = 0;
    for (; index < buffer.length; index++) {
      const char = buffer[index];
      if (start === -1) {
        if (/\s/.test(char)) {
          consumed = index + 1;
          continue;
        }
        if (char !== "{" && char !== "[")
          throw new SyntaxError(
            "A JSON stream record must be an object or array."
          );
        start = index;
      }
      if (quoted) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') quoted = false;
      } else if (char === '"') quoted = true;
      else if (char === "{" || char === "[") depth++;
      else if (char === "}" || char === "]") {
        depth--;
        if (depth === 0) {
          values.push(JSON.parse(buffer.slice(start, index + 1)));
          consumed = index + 1;
          start = -1;
        }
      }
    }
    buffer = buffer.slice(consumed);
    index -= consumed;
    if (start !== -1) start -= consumed;
    return values;
  };

  return {
    write: (chunk) =>
      consume(
        typeof chunk === "string" ? chunk : utf8.write(Buffer.from(chunk))
      ),
    end: () => {
      const values = consume(utf8.end());
      if (buffer.trim())
        throw new SyntaxError("The JSON stream ended within a record.");
      return values;
    },
  };
};
