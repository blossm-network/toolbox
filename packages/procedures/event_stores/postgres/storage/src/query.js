import { fields, binaryFields } from "./document.js";

const rangeOperators = { $gt: ">", $gte: ">=", $lt: "<", $lte: "<=" };
const numeric = new Set(["number", "value"]);
const timestamps = new Set(["created", "updated"]);

export default ({ store, query = {}, sort, select, limit }) => {
  const values = [];
  const parameter = (value) => {
    values.push(value);
    return `$${values.length}`;
  };

  // $and is the generic aggregate query's conjunction; flatten it into the
  // same AND list. No other logical operator is translated.
  const predicates = (query) =>
    Object.entries(query).flatMap(([path, value]) => {
      if (path != "$and") return [[path, value]];
      if (
        !Array.isArray(value) ||
        !value.length ||
        value.some(
          (item) =>
            item === null || typeof item != "object" || Array.isArray(item),
        )
      )
        throw new TypeError("$and requires a nonempty array of queries.");
      return value.flatMap(predicates);
    });

  const conditions = predicates(query).map(([path, value]) => {
    const column = Object.hasOwn(fields[store.kind], path)
      ? fields[store.kind][path]
      : undefined;
    if (column) {
      if (
        value !== null &&
        typeof value == "object" &&
        !(value instanceof Date)
      ) {
        if (!numeric.has(column) && !timestamps.has(column))
          throw new TypeError(
            "Range queries require numeric or timestamp metadata.",
          );
        const entries = Object.entries(value);
        if (!entries.length)
          throw new TypeError("An empty range is unsupported.");
        return entries
          .map(([operator, bound]) => {
            if (!Object.hasOwn(rangeOperators, operator))
              throw new TypeError(`Unsupported query operator: ${operator}.`);
            return `${column} ${rangeOperators[operator]} ${parameter(bound)}`;
          })
          .join(" AND ");
      }
      if (value === null) return `${column} IS NULL`;
      return `${column} = ${parameter(value)}`;
    }

    const parts = path.split(".");
    if (
      !["payload", "state"].includes(parts[0]) ||
      parts.some((part) => !part || part.startsWith("$")) ||
      (parts[0] == "payload" && store.kind != "events") ||
      (parts[0] == "state" && store.kind != "snapshots")
    )
      throw new TypeError(`Unsupported query field: ${path}.`);
    if (
      value === undefined ||
      (value &&
        typeof value == "object" &&
        Object.keys(value).some((key) => key.startsWith("$")))
    )
      throw new TypeError("Payload and state queries support equality only.");

    // The whole JSONPath is a parameter, including quoted names and values.
    const jsonPath = `lax $${parts
      .map((part) => `.${JSON.stringify(part)}`)
      .join("")}`;
    if (value === null || typeof value != "object") {
      const predicate = parameter(
        `${jsonPath} ? (@ == ${JSON.stringify(value)})`,
      );
      if (value === null)
        return `(doc @? ${predicate}::jsonpath OR NOT jsonb_path_exists(doc, ${parameter(
          jsonPath,
        )}::jsonpath))`;
      return `doc @? ${predicate}::jsonpath`;
    }

    // JSONPath comparison does not support object/array equality. JSONB does.
    const pathParameter = parameter(jsonPath);
    const expected = parameter(JSON.stringify(value));
    return `EXISTS (
      SELECT 1 FROM jsonb_path_query(doc, ${pathParameter}::jsonpath) AS matched(value)
      WHERE matched.value = ${expected}::jsonb
        OR EXISTS (
          SELECT 1 FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(matched.value) = 'array' THEN matched.value ELSE '[]'::jsonb END
          ) AS element(value)
          WHERE element.value = ${expected}::jsonb
        )
    )`;
  });

  const ordering = Object.entries(sort || {}).map(([path, direction]) => {
    const column = Object.hasOwn(fields[store.kind], path)
      ? fields[store.kind][path]
      : undefined;
    if (!column || (direction !== 1 && direction !== -1))
      throw new TypeError(`Unsupported sort: ${path}.`);
    return `${column} ${direction == 1 ? "ASC" : "DESC"}`;
  });

  // Both supported snapshot projections omit the binary events column.
  const rootOnly = select && select["headers.root"] === 1;
  if (
    select &&
    (store.kind != "snapshots" ||
      Object.keys(select).length != 1 ||
      (select.events !== 0 && !rootOnly))
  )
    throw new TypeError(
      "Only snapshot events exclusion or root selection is supported.",
    );

  const projection =
    store.kind == "counts"
      ? "root, value, updated"
      : rootOnly
        ? "jsonb_build_object('headers', jsonb_build_object('root', root)) AS doc"
        : ["doc", ...(select ? [] : binaryFields[store.kind])].join(", ");

  let text = `SELECT ${projection} FROM ${store.table}`;
  if (conditions.length) text += ` WHERE ${conditions.join(" AND ")}`;
  if (ordering.length) text += ` ORDER BY ${ordering.join(", ")}`;
  // A null limit means unbounded, as it does for the Mongo adapter.
  if (limit != null) text += ` LIMIT ${parameter(limit)}`;
  return { text, values };
};
