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

const get =
  fs.existsSync(path.resolve(__dirname, "../../get.js")) &&
  import("../../get.js");

describe("View store get tests", () => {
  if (!get) return;
  it("should convert correctly", async () => {
    const query = { some: "query" };
    const context = { some: "context" };
    const result = get({ query, context });
    expect(result).to.deep.equal(query);
  });
});
