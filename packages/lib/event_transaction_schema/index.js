// Normalize transaction dates to the JSON representation committed by tHash.
const timestamp = {
  type: String,
  set: (value) => (value == null ? value : new Date(value).toISOString()),
};

const open = { _id: false, strict: false, minimize: false };

// The caller supplies the Schema constructor, so the schema belongs to the
// caller's Mongoose instance and this package needs no dependency on it.
export default (Schema) =>
  new Schema(
    {
      ip: String,
      id: String,
      claims: {
        type: new Schema(
          {
            iss: String,
            aud: {
              type: Object,
              validate: (value) =>
                typeof value == "string" ||
                (Array.isArray(value) &&
                  value.every((audience) => typeof audience == "string")),
            },
            sub: String,
            exp: timestamp,
            iat: timestamp,
            nbf: timestamp,
            jti: String,
          },
          open,
        ),
      },
      path: {
        type: [
          new Schema(
            {
              name: String,
              id: String,
              domain: String,
              service: String,
              network: { type: String, required: true },
              host: { type: String, required: true },
              procedure: { type: String, required: true },
              hash: { type: String, required: true },
              issued: timestamp,
              timestamp,
            },
            open,
          ),
        ],
        default: undefined,
      },
    },
    { _id: false, minimize: false },
  );
