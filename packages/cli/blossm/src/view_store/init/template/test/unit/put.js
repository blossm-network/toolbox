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

const put =
  fs.existsSync(path.resolve(__dirname, "../../put.js")) &&
  import("../../put");

describe("View store put tests", () => {
  if (!put) return;
  it("should convert correctly", async () => {
    const body = { view: { some: "body" } };
    const result = put(body);
    expect(result.update).to.equal(0);
  });
});
