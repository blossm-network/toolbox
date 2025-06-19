import fs from "fs";
import path from "path";
import * as chai from "chai";
import sinonChai from "sinon-chai";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

chai.use(sinonChai);
const { expect } = chai;

const format =
  fs.existsSync(path.resolve(__dirname, "../../get.js")) &&
  import("../../format.js");

describe("View store format tests", () => {
  if (!format) return;
  it("should convert correctly", async () => {
    const body = "some-body";
    const result = format({ body });
    expect(result.body).to.deep.equal(body);
  });
});
