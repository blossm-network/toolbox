import { expect } from "chai";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

const require = createRequire(import.meta.url);

describe("MongoDB schema and update safety", () => {
  it("does not mutate Object.prototype when rejecting a malicious update", () => {
    const result = execFileSync(
      process.execPath,
      [
        "-e",
        `const mongoose = require(${JSON.stringify(
          require.resolve("mongoose")
        )});
         const Model = mongoose.model("CastingSecurityCheck", new mongoose.Schema({name: String}));
         try {
           Model.updateOne({}, {})._castUpdate(JSON.parse('{"$set":{"__proto__.x":"audit"}}'));
         } catch (_) {}
         console.log(JSON.stringify({polluted: Object.hasOwn(Object.prototype, "$fullPath")}));`,
      ],
      { encoding: "utf8" }
    );
    expect(JSON.parse(result).polluted).to.equal(false);
  });
  it("does not overwrite shared built-in functions through a mixed dotted path", () => {
    const result = execFileSync(
      process.execPath,
      [
        "-e",
        `const mongoose = require(${JSON.stringify(require.resolve("mongoose"))});
         const Model = mongoose.model("MixedPathSecurityCheck", new mongoose.Schema({meta: {}}));
         new Model(JSON.parse('{"meta.toString.call":1}'));
         console.log(JSON.stringify({callType: typeof Object.prototype.toString.call}));`,
      ],
      { encoding: "utf8" }
    );
    expect(JSON.parse(result).callType).to.equal("function");
  });
});
