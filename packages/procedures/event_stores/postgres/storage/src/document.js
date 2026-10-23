export const fields = {
  events: {
    hash: "hash",
    "headers.nonce": "nonce",
    "headers.root": "root",
    "headers.number": "number",
    "headers.created": "created",
    "headers.idempotency": "idempotency",
  },
  snapshots: {
    hash: "hash",
    "headers.nonce": "nonce",
    "headers.root": "root",
    "headers.number": "number",
    "headers.created": "created",
  },
  blockchain: {
    hash: "hash",
    "headers.number": "number",
    "headers.created": "created",
  },
  counts: { root: "root", value: "value", updated: "updated" },
};

export const binaryFields = {
  events: [],
  snapshots: ["events"],
  blockchain: ["events", "snapshots", "txs"],
};

export const columns = (kind) => [
  ...Object.values(fields[kind]),
  "doc",
  ...binaryFields[kind],
];

export const encode = ({ kind, document }) => {
  const doc = { ...document };
  for (const key of binaryFields[kind]) delete doc[key];

  return [
    ...Object.keys(fields[kind]).map((path) =>
      path.split(".").reduce((value, key) => value[key], document)
    ),
    JSON.stringify(doc),
    ...binaryFields[kind].map((key) => document[key]),
  ];
};

export const decode = ({ kind, row, select }) => {
  if (kind == "counts")
    return {
      root: row.root,
      value: Number(row.value),
      updated:
        row.updated instanceof Date ? row.updated.toISOString() : row.updated,
    };

  return {
    ...row.doc,
    ...Object.fromEntries(
      binaryFields[kind]
        .filter((key) => !select || select[key] !== 0)
        .map((key) => [key, row[key]])
    ),
  };
};
