import fs from "fs";
import path from "path";
import * as chai from "chai";
import sinonChai from "sinon-chai";
chai.use(sinonChai);
const { expect } = chai;

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const normalize =
  fs.existsSync(path.resolve(__dirname, "../../normalize.js")) &&
  import("../../normalize.js");

const { testing } = (await import("../../config.json", { with: { type: "json" } })).default;

describe("Command handler store normalize tests", () => {
  it("should have at least one example", async () => {
    if (!normalize || !testing.normalize) return;
    expect(testing.normalize).to.exist;
  });
  it("should clean correctly", async () => {
    if (!normalize || !testing.normalize) return;
    for (const { payload, normalized } of testing.normalize) {
      const cleanedPayload = await normalize({
        ...payload,
        bogusPropertyasdf: "nope",
      });

      expect(cleanedPayload).to.deep.equal(normalized);
    }
  });
});
