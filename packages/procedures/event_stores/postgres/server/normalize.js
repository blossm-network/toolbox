import { Mongoose } from "mongoose";
import formatSchema from "@blossm/format-mongodb-schema";
import transactionSchema from "@blossm/event-transaction-schema";
import hash from "@blossm/hash";
import { badRequest } from "@blossm/errors";

const typeKey = "$type";

// Types whose cast values survive a JSON/JSONB round trip. BSON-only types
// (ObjectId, Buffer, Decimal128, Map, UUID, BigInt, ...) are rejected at startup.
const jsonTypes = ["String", "Number", "Boolean", "Date", "Mixed"];

const assertSupported = (type, path) => {
  // Subdocuments and document arrays carry their own schema.
  if (type.schema)
    return type.schema.eachPath((name, child) =>
      assertSupported(child, `${path}.${name}`),
    );
  // Mongoose 9 exposes an array's element type as embeddedSchemaType.
  if (type.instance == "Array" && type.embeddedSchemaType)
    return assertSupported(type.embeddedSchemaType, `${path}.$`);
  if (!jsonTypes.includes(type.instance))
    throw new TypeError(
      `Unsupported PostgreSQL event-store schema type at ${path}: ${type.instance}.`,
    );
};

// Disconnected Mongoose models give declared schemas the Mongo adapter's
// casting, stripping and validation without a MongoDB connection. The result is
// plain JSON, so the bytes hashed by the generic procedures are the bytes JSONB stores.
export default (schema) => {
  if (
    schema !== undefined &&
    (schema === null || typeof schema != "object" || Array.isArray(schema))
  )
    throw new TypeError("PostgreSQL event-store schema must be an object.");

  // A private instance keeps these models out of the global Mongoose registry.
  const mongoose = new Mongoose();
  const model = (name, definition, options) => {
    // Same schema options as the Mongo store owner (@blossm/mongodb-database).
    const built = new mongoose.Schema(definition, {
      _id: false,
      strict: true,
      typePojoToMixed: false,
      versionKey: false,
      minimize: false,
      autoIndex: false,
      autoCreate: false,
      ...options,
    });
    built.eachPath((path, type) => assertSupported(type, path));
    return mongoose.model(name, built);
  };

  const normalize = (Model, field, message) => async (value) => {
    try {
      // Mongoose silently drops a non-object assigned to a nested path.
      if (value === null || typeof value != "object" || Array.isArray(value))
        throw new TypeError("An object is required.");
      const document = new Model({ [field]: value });
      await document.validate();
      return JSON.parse(
        JSON.stringify(document.toObject({ minimize: false })[field]),
      );
    } catch (cause) {
      throw badRequest.message(message, { cause });
    }
  };

  // The transaction schema is the one the Mongo event model uses for `tx`.
  const normalizeTransactionFn = normalize(
    model("Transaction", {
      tx: { type: transactionSchema(mongoose.Schema) },
    }),
    "tx",
    "Invalid transaction metadata.",
  );

  // Without declared fields, payloads and state stay the caller's raw JSON,
  // as an empty Mongo schema leaves them Mixed.
  if (schema === undefined || !Object.keys(schema).length)
    return { normalizeTransactionFn };

  // Payload and state options match the Mongo server's event and snapshot stores.
  const format = (options) => formatSchema(schema, typeKey, { options });
  const normalizeStateFn = normalize(
    model(
      "Snapshot",
      { state: format({ default: undefined, unique: false }) },
      { typeKey },
    ),
    "state",
    "Invalid snapshot state.",
  );

  return {
    normalizeTransactionFn,
    normalizePayloadFn: normalize(
      model(
        "Event",
        {
          payload: format({
            required: false,
            unique: false,
            default: undefined,
          }),
        },
        { typeKey },
      ),
      "payload",
      "Invalid event payload.",
    ),
    // Snapshot state is hashed by the block builder before it is saved, so it
    // is checked, never rewritten: a cast that would change it fails the save.
    assertStateFn: async (state) => {
      const normalized = await normalizeStateFn(state);
      if (hash(normalized).create() != hash(state).create())
        throw badRequest.message(
          "Snapshot state does not match its declared schema.",
        );
    },
  };
};
