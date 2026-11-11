import assert from "node:assert/strict";
import mongoose from "mongoose";
import deps from "../deps.js";

// Construct and validate real Mongoose models without opening a connection.
describe("Formatted array schema contracts", () => {
  it("enforces retained options and preserves explicit event-store overrides", async () => {
    const validate = (values) => values == null || values.length <= 2;
    const descriptor = {
      type: [String],
      required: true,
      default: ["seed"],
      index: true,
      validate,
    };
    const schema = { labels: descriptor };
    const formatted = deps.formatSchema(schema, "$type");
    const definition = new mongoose.Schema(formatted, { typeKey: "$type" });
    const connection = mongoose.createConnection();
    const Model = connection.model("ArrayOptions", definition);
    try {
      assert.deepEqual(new Model().labels.toObject(), ["seed"]);
      await assert.rejects(
        new Model({ labels: null }).validate(),
        (error) => error.errors.labels.kind === "required",
      );
      await assert.rejects(
        new Model({ labels: ["a", "b", "c"] }).validate(),
        (error) => error.errors.labels.kind === "user defined",
      );
      await new Model({ labels: ["a"] }).validate();
      assert.deepEqual(
        definition.indexes().map(([keys]) => keys),
        [{ labels: 1 }],
      );
      assert.equal(definition.path("labels").options.validate, validate);
      assert.deepEqual(descriptor, {
        type: [String],
        required: true,
        default: ["seed"],
        index: true,
        validate,
      });

      const eventDefinition = new mongoose.Schema(
        deps.formatSchema(schema, "$type", {
          options: { required: false, unique: false, default: undefined },
        }),
        { typeKey: "$type" },
      );
      const Event = connection.model("EventArrayOptions", eventDefinition);
      assert.equal(new Event().labels, undefined);
      await new Event({ labels: null }).validate();
      await assert.rejects(
        new Event({ labels: ["a", "b", "c"] }).validate(),
        (error) => error.errors.labels.kind === "user defined",
      );
    } finally {
      connection.deleteModel(/.*/);
    }
  });
});
