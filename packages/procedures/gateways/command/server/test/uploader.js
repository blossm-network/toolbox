import { expect } from "chai";
import { Readable } from "node:stream";
import uploader from "../uploader.js";

const upload = (body, limits) => {
  const req = Readable.from([Buffer.from(body)]);
  req.headers = {
    "content-type": "multipart/form-data; boundary=audit",
    "content-length": String(Buffer.byteLength(body)),
  };
  return new Promise((resolve, reject) =>
    uploader(limits)(req, {}, (error) => (error ? reject(error) : resolve(req)))
  );
};

const file = (data) =>
  `--audit\r\nContent-Disposition: form-data; name="file"; filename="a.txt"\r\nContent-Type: text/plain\r\n\r\n${data}\r\n--audit--\r\n`;

const rejects = async (promise, code) => {
  try {
    await promise;
    throw new Error("Upload should have failed");
  } catch (error) {
    expect(error.code).to.equal(code);
  }
};

describe("Command gateway uploads", () => {
  it("preserves accepted file bytes", async () => {
    const req = await upload(file("hello"));
    expect(req.files[0].buffer.toString()).to.equal("hello");
  });

  it("enforces file byte limits", async () => {
    await rejects(upload(file("hello"), { fileSize: 4 }), "LIMIT_FILE_SIZE");
  });

  it("enforces file count limits", async () => {
    await rejects(upload(file("hello"), { files: 0 }), "LIMIT_FILE_COUNT");
  });

  it("enforces field byte limits", async () => {
    await rejects(
      upload(
        '--audit\r\nContent-Disposition: form-data; name="field"\r\n\r\nhello\r\n--audit--\r\n',
        { fieldSize: 4 }
      ),
      "LIMIT_FIELD_VALUE"
    );
  });
});
