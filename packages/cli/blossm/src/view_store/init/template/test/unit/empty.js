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

const empty =
  fs.existsSync(path.resolve(__dirname, "../../get.js")) &&
  import("../../empty");

describe("View store format tests", () => {
  if (!empty) return;
  it("should convert correctly", async () => {
    const query = "some-query";
    const result = empty({ query });
    expect(result.body).to.deep.equal(query);
  });
});
