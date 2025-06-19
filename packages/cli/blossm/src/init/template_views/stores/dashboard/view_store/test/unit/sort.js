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

const sort =
  fs.existsSync(path.resolve(__dirname, "../../sort.js")) &&
  import("../../sort.js");

describe("View store sort tests", () => {
  if (!sort) return;
  it("should convert correctly", async () => {
    const sort = { some: "sort" };
    const result = sort(sort);
    expect(result).to.deep.equal(sort);
  });
});
