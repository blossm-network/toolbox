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

// The shared schema formatter rewrites an array of arrays as an array of
// objects keyed "0", which would silently reshape submitted data.
const assertNoNestedArrays = (value, path) => {
  if (value === null || typeof value != "object") return;
  if (Array.isArray(value) && Array.isArray(value[0]))
    throw new TypeError(
      `Unsupported PostgreSQL event-store schema type at ${path}: array of arrays.`,
    );
  for (const [key, child] of Object.entries(value))
    assertNoNestedArrays(child, `${path}.${key}`);
};

// The formatter reads field options only on a top-level field with a `type`.
// Its other keys (default, enum, ...) hold data, not type declarations. A
// `type` that itself has a `type` instead declares a nested object's field.
const hasOptions = (field) =>
  field !== null &&
  typeof field == "object" &&
  !Array.isArray(field) &&
  field.type != undefined &&
  (typeof field.type != "object" ||
    Array.isArray(field.type) ||
    field.type.type == undefined);

const at = (value, path) =>
  path
    .split(".")
    .reduce(
      (parent, key) =>
        parent != null && Object.hasOwn(parent, key) ? parent[key] : undefined,
      value,
    );

// Mongoose silently drops a non-object assigned to a nested path, at any
// depth, and casts an array given as a document-array element to an empty object.
const assertObjects = (schema, value) => {
  for (const path of Object.keys(schema.nested)) {
    const nested = at(value, path);
    if (nested != null && (typeof nested != "object" || Array.isArray(nested)))
      throw new TypeError(`An object is required at ${path}.`);
  }
  schema.eachPath((path, type) => {
    if (!type.schema) return;
    const child = at(value, path);
    for (const item of Array.isArray(child) ? child : [child]) {
      if (Array.isArray(item))
        throw new TypeError(`An object is required in ${path}.`);
      if (item !== null && typeof item == "object")
        assertObjects(type.schema, item);
    }
  });
};

// JSON has no non-finite numbers; stringify would silently store them as null.
const finite = (_, value) => {
  if (typeof value == "number" && !Number.isFinite(value))
    throw new TypeError("A finite number is required.");
  return value;
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
  for (const [name, field] of Object.entries(schema ?? {}))
    if (hasOptions(field)) assertNoNestedArrays(field.type, `${name}.type`);
    else assertNoNestedArrays(field, name);

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
      if (value === null || typeof value != "object" || Array.isArray(value))
        throw new TypeError("An object is required.");
      assertObjects(Model.schema, { [field]: value });
      const document = new Model({ [field]: value });
      await document.validate();
      return JSON.parse(
        JSON.stringify(document.toObject({ minimize: false })[field], finite),
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
