import { randomBytes, randomUUID } from "node:crypto";
import { expect } from "chai";
import { connect } from "@blossm/postgres-database";

import stores, {
  find,
  stream,
  create,
  save,
  findPublications,
  removePublication,
  incrementPublicationAttempts,
  streamPendingRoots,
} from "../../index.js";

if (!process.env.TEST_POSTGRES_URL)
  throw new Error(
    "Set TEST_POSTGRES_URL to a disposable PostgreSQL test database.",
  );

// Every schema this suite creates contains this marker, and only those drop.
const run = `bst_${randomUUID().slice(0, 8)}`;
const created = "2026-10-22T00:00:00.000Z";
const at = (minute) => new Date(Date.UTC(2026, 0, 1, 0, minute)).toISOString();

// Every table and index one namespace owns when document indexes are declared.
const objects = [
  "blockchain",
  "blockchain_number_key",
  "blockchain_pkey",
  "counts",
  "counts_pkey",
  "counts_updated_reverse_root",
  "counts_updated_root",
  "events",
  "events_created_number",
  "events_document",
  "events_idempotency_key",
  "events_nonce_key",
  "events_pkey",
  "events_root_number_key",
  "publications",
  "publications_pending",
  "publications_pkey",
  "snapshots",
  "snapshots_document",
  "snapshots_nonce_key",
  "snapshots_pkey",
  "snapshots_root_created",
  "snapshots_root_number_key",
].sort();

const event = (root, number, { headers, ...rest } = {}) => {
  const id = randomUUID();
  return {
    hash: `hash-${id}`,
    headers: {
      nonce: `nonce-${id}`,
      root,
      number,
      created,
      idempotency: `idempotency-${id}`,
      ...headers,
    },
    payload: {},
    ...rest,
  };
};
const snapshot = (root, number, { headers, ...rest } = {}) => {
  const id = randomUUID();
  return {
    hash: `hash-${id}`,
    headers: {
      nonce: `nonce-${id}`,
      root,
      number,
      created,
      lastEventNumber: number,
      ...headers,
    },
    state: {},
    events: Buffer.from([1]),
    ...rest,
  };
};
const block = (number, rest) => ({
  hash: `hash-${randomUUID()}`,
  headers: { number, created },
  events: Buffer.from([1]),
  snapshots: Buffer.from([2]),
  txs: Buffer.from([3]),
  ...rest,
});
const notice = (rest) => ({
  hash: `hash-${randomUUID()}`,
  created,
  topic: "topic",
  ...rest,
});
const without = (document, ...keys) =>
  Object.fromEntries(
    Object.entries(document).filter(([key]) => !keys.includes(key)),
  );
// Exactly 63 UTF-8 bytes: the longest identifier PostgreSQL does not truncate.
const fill = (prefix, tail = "") => {
  const room = 63 - Buffer.byteLength(prefix + tail);
  const name = `${prefix}${"é".repeat(Math.floor(room / 2))}${"a".repeat(
    room % 2,
  )}${tail}`;
  expect(Buffer.byteLength(name)).to.equal(63);
  return name;
};

const failure = async (fn) => {
  try {
    await fn();
  } catch (err) {
    return err;
  }
  throw new Error("Expected the operation to fail.");
};

describe("Postgres event store storage integration", function () {
  this.timeout(20000);
  const pools = [];
  let database;
  let main;

  const pool = (max) => {
    const created = connect({
      connectionString: process.env.TEST_POSTGRES_URL,
      max,
      connectionTimeoutMillis: 5000,
    });
    pools.push(created);
    return created;
  };
  // PostgreSQL's own identifier quoting, independent of the package under test.
  const execute = async (template, ...names) => {
    const {
      rows: [{ statement }],
    } = await database.query(
      "SELECT format($1::text, VARIADIC $2::text[]) AS statement",
      [template, names],
    );
    return database.query(statement);
  };
  const namespaces = async () =>
    (
      await database.query(
        "SELECT nspname FROM pg_namespace WHERE position($1::text in nspname) > 0",
        [run],
      )
    ).rows.map(({ nspname }) => nspname);
  // Tables and indexes found under the literal schema name; none half-built.
  const layout = async (namespace) => {
    const { rows } = await database.query(
      `SELECT c.relname AS name,
          COALESCE(i.indisvalid AND i.indisready, true) AS valid
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        LEFT JOIN pg_index i ON i.indexrelid = c.oid
        WHERE n.nspname = $1 AND c.relkind IN ('r', 'i')`,
      [namespace],
    );
    expect(rows.filter(({ valid }) => !valid)).to.deep.equal([]);
    return rows.map(({ name }) => name).sort();
  };
  const all = (store, options) => find({ store, limit: null, ...options });
  const count = (store, root, value, updated = created) =>
    database.query(`INSERT INTO ${store.table} VALUES ($1, $2, $3)`, [
      root,
      value,
      updated,
    ]);
  const collect = async (read, options) => {
    const documents = [];
    await read({ ...options, fn: (document) => documents.push(document) });
    return documents;
  };
  const pending = (stores, options) =>
    collect(streamPendingRoots, {
      store: stores.countsStore,
      snapshotStore: stores.snapshotStore,
      ...options,
    });
  const violation = async (fn, constraint) => {
    const error = await failure(fn);
    expect(error.code).to.equal("23505");
    expect(error.constraint).to.equal(constraint);
  };

  before(async () => {
    database = pool(4);
    main = await stores({
      database,
      namespace: `${run}_main`,
      indexes: ["label"],
    });
  });

  beforeEach(() =>
    database.query(
      `TRUNCATE ${Object.values(main)
        .map(({ table }) => table)
        .join(", ")}`,
    ),
  );

  after(async () => {
    try {
      for (const namespace of await namespaces())
        await execute("DROP SCHEMA %I CASCADE", namespace);
    } finally {
      await Promise.allSettled(pools.map((pool) => pool.end()));
    }
  });

  describe("initialization", () => {
    it("should initialize one cold namespace from concurrent independent pools and preserve its data on rerun", async () => {
      const namespace = `${run}_cold`;
      const initialize = async (workers) => {
        const results = await Promise.allSettled(
          workers.map((indexes) =>
            stores({ database: pool(1), namespace, indexes }),
          ),
        );
        // Every worker has settled before any assertion or cleanup.
        expect(
          results
            .filter(({ status }) => status == "rejected")
            .map(({ reason }) => reason),
        ).to.deep.equal([]);
        return results.map(({ value }) => value);
      };

      expect(await layout(namespace)).to.deep.equal([]);
      const cold = await initialize(Array(8).fill(["label"]));
      expect(await layout(namespace)).to.deep.equal(objects);
      expect(
        new Set(cold.map(({ eventStore }) => eventStore.table)).size,
      ).to.equal(1);

      const existing = await stores({
        database,
        namespace,
        indexes: ["label"],
      });
      const documents = {
        eventStore: event("root", 0, { payload: { label: "kept" } }),
        snapshotStore: snapshot("root", 0, { state: { label: "kept" } }),
        blockchainStore: block(0),
        publicationsStore: notice(),
      };
      await create({
        store: existing.eventStore,
        data: [documents.eventStore],
      });
      await save({
        store: existing.snapshotStore,
        data: documents.snapshotStore,
      });
      await save({
        store: existing.blockchainStore,
        data: documents.blockchainStore,
      });
      await create({
        store: existing.publicationsStore,
        data: [documents.publicationsStore],
      });
      await count(existing.countsStore, "root", 1);

      // Warm reruns, with and without declared indexes, change nothing.
      await initialize([[], ["label"], [], ["label", "items.code"], []]);
      expect(await layout(namespace)).to.deep.equal(objects);
      for (const [name, document] of Object.entries(documents))
        expect(await all(existing[name])).to.deep.equal([document]);
      expect(await all(existing.countsStore)).to.deep.equal([
        { root: "root", value: 1, updated: created },
      ]);
    });

    it("should roll back every DDL statement when initialization fails part way", async () => {
      const namespace = `${run}_partial`;
      // An incompatible table: this package never migrates an existing layout.
      await execute("CREATE SCHEMA %I", namespace);
      await execute(
        "CREATE TABLE %I.snapshots (hash text PRIMARY KEY)",
        namespace,
      );
      const error = await failure(() =>
        stores({ database, namespace, indexes: ["label"] }),
      );
      // The events table and its index were created before this failure.
      expect(error.code).to.equal("42703");
      expect(await layout(namespace)).to.deep.equal([
        "snapshots",
        "snapshots_pkey",
      ]);
    });
  });

  describe("namespaces", () => {
    it("should keep identical roots and hashes apart across case, quoting, normalization and the 63-byte boundary", async () => {
      const names = [
        `${run}_Case`,
        `${run}_case`,
        `${run} "quoted" 'name'; --.x\\`,
        `${run}_é`,
        `${run}_é`,
        `${run}_😀 schéma`,
        // Truncation anywhere before byte 63 would alias these two.
        fill(`${run}_`, "é"),
        fill(`${run}_`, "ê"),
      ];
      const shared = event("root", 0);
      const kept = snapshot("root", 0, { hash: shared.hash });
      const prepared = [];
      for (const namespace of names) {
        const namespaced = await stores({ database, namespace });
        const document = { ...shared, payload: { namespace } };
        await create({ store: namespaced.eventStore, data: [document] });
        await save({
          store: namespaced.snapshotStore,
          data: { ...kept, state: { namespace } },
        });
        prepared.push({ namespaced, document });
      }

      expect(await namespaces()).to.include.members(names);
      for (const { namespaced, document } of prepared) {
        expect(await all(namespaced.eventStore)).to.deep.equal([document]);
        expect(
          await find({
            store: namespaced.snapshotStore,
            query: { "headers.root": "root" },
            select: { events: 0 },
          }),
        ).to.deep.equal([
          { ...without(kept, "events"), state: document.payload },
        ]);
      }

      // A namespace separates data, not access: one role uses all of them.
      const { rows } = await database.query(
        `SELECT count(*)::integer AS count,
            bool_and(has_schema_privilege(oid, 'USAGE')) AS usable
          FROM pg_namespace WHERE nspname = ANY($1)`,
        [names],
      );
      expect(rows).to.deep.equal([{ count: names.length, usable: true }]);
    });

    it("should reject unrepresentable namespaces without creating or aliasing a schema", async () => {
      const boundary = fill(`${run}_r`);
      const { eventStore } = await stores({ database, namespace: boundary });
      const document = event("root", 0);
      await create({ store: eventStore, data: [document] });
      const existing = await namespaces();

      for (const namespace of [
        "",
        7,
        `${run}\0`,
        // PostgreSQL would truncate both of these to the boundary namespace.
        `${boundary}a`,
        `${boundary}é`,
        `${run}_${"n".repeat(64)}`,
        // Unpaired surrogates would all be stored as U+FFFD.
        `${run}\ud800`,
        `${run}\udc00`,
      ])
        expect(
          await failure(() => stores({ database, namespace })),
        ).to.be.instanceOf(TypeError);

      // PostgreSQL itself reserves this prefix and rolls the attempt back.
      expect(
        (await failure(() => stores({ database, namespace: `pg_${run}` })))
          .code,
      ).to.equal("42939");

      expect(await namespaces()).to.have.members(existing);
      expect(await all(eventStore)).to.deep.equal([document]);
    });
  });

  describe("injection resistance", () => {
    const sentinelSchema = `${run}_s`;
    const drop = `DROP SCHEMA "${sentinelSchema}" CASCADE; --`;
    let sentinel;

    const expectIntact = async () => {
      expect(
        (await execute("SELECT id FROM %I.canary", sentinelSchema)).rows,
      ).to.deep.equal([{ id: "intact" }]);
      expect(
        await find({ store: main.eventStore, query: { hash: sentinel.hash } }),
      ).to.deep.equal([sentinel]);
      expect(await layout(`${run}_main`)).to.deep.equal(objects);
    };

    before(async () => {
      await execute("CREATE SCHEMA %I", sentinelSchema);
      await execute(
        "CREATE TABLE %I.canary AS SELECT 'intact'::text AS id",
        sentinelSchema,
      );
    });

    beforeEach(async () => {
      sentinel = event("sentinel", 0, { payload: { name: "sentinel" } });
      await create({ store: main.eventStore, data: [sentinel] });
    });

    it("should treat a malicious namespace as one literal schema name", async () => {
      const hostile = [
        `${run}"; ${drop}`,
        `${run}'; ${drop}`,
        `${run}\\"; SELECT $1; /*`,
      ];
      for (const namespace of hostile) {
        const namespaced = await stores({
          database,
          namespace,
          indexes: ["label"],
        });
        expect(await layout(namespace)).to.deep.equal(objects);

        const document = event("root", 0);
        await create({ store: namespaced.eventStore, data: [document] });
        expect(await all(namespaced.eventStore)).to.deep.equal([document]);
        // The pending-root source interpolates both quoted table names.
        await count(namespaced.countsStore, "root", 1);
        expect(await pending(namespaced)).to.deep.equal([
          { root: "root", value: 1, updated: created },
        ]);
      }
      expect(await namespaces()).to.include.members(hostile);
      await expectIntact();
    });

    it("should compare and store hostile metadata values as literal parameters", async () => {
      const store = main.eventStore;
      const text = `x'; ${drop}`;
      const hostile = event(text, 1, {
        hash: text,
        headers: { nonce: text, idempotency: text },
        payload: { [text]: text },
      });
      await create({ store, data: [hostile] });
      for (const path of [
        "hash",
        "headers.root",
        "headers.nonce",
        "headers.idempotency",
      ])
        expect(await find({ store, query: { [path]: text } })).to.deep.equal([
          hostile,
        ]);
      for (const value of [
        "' OR '1'='1",
        '" OR ""="',
        "x' OR hash IS NOT NULL; --",
        "$1",
      ])
        for (const path of ["hash", "headers.root"])
          expect(await find({ store, query: { [path]: value } })).to.deep.equal(
            [],
          );

      // Typed parameters fail PostgreSQL's input conversion; none runs as SQL.
      for (const options of [
        { query: { "headers.number": "0 OR 1=1" } },
        { query: { "headers.number": { $gte: "0; DROP TABLE events" } } },
        {
          query: { "headers.created": { $lt: "now'; DROP TABLE events; --" } },
        },
        { limit: "1; DROP TABLE events" },
      ])
        expect(
          (await failure(() => find({ store, ...options }))).code,
        ).to.match(/^22/);

      const publications = main.publicationsStore;
      const notices = [notice({ hash: "' OR '1'='1" }), notice()];
      await create({ store: publications, data: notices });
      const attempts = async () =>
        (
          await database.query(
            `SELECT hash, attempts::integer FROM ${publications.table} ORDER BY attempts`,
          )
        ).rows;
      for (const hash of ["x' OR '1'='1", "x' OR hash IS NOT NULL; --"]) {
        await removePublication({ store: publications, query: { hash } });
        await incrementPublicationAttempts({
          store: publications,
          query: { hash },
        });
      }
      expect(await attempts()).to.have.deep.members(
        notices.map(({ hash }) => ({ hash, attempts: 0 })),
      );
      await incrementPublicationAttempts({
        store: publications,
        query: { hash: notices[0].hash },
      });
      expect(await attempts()).to.deep.equal([
        { hash: notices[1].hash, attempts: 0 },
        { hash: notices[0].hash, attempts: 1 },
      ]);
      await removePublication({
        store: publications,
        query: { hash: notices[0].hash },
      });
      expect(
        await findPublications({ store: publications, limit: 10 }),
      ).to.deep.equal([notices[1]]);
      await expectIntact();
    });

    it("should match hostile JSONPath names and values literally", async () => {
      const store = main.eventStore;
      const syntax = ["*", "**", "a ? (@ == 1)", "x[*]", "name || true"];
      const key = `na"me') OR true; --`;
      const value = `plain" || @ != "\\`;
      // Interpreted as JSONPath syntax, each key above would match this event.
      const plain = event("plain", 0, {
        payload: { a: 1, x: [1], name: "plain", other: 1 },
      });
      const literal = event("literal", 0, {
        payload: Object.fromEntries(syntax.map((name) => [name, 1])),
      });
      const quoted = event("quoted", 0, { payload: { [key]: value } });
      await create({ store, data: [plain, literal, quoted] });

      for (const name of syntax)
        expect(
          await find({ store, query: { [`payload.${name}`]: 1 } }),
        ).to.deep.equal([literal]);
      expect(
        await find({ store, query: { "payload.name": "plain" } }),
      ).to.deep.equal([plain]);
      for (const hostile of [value, 'plain" || "', "plain' OR '1'='1"])
        expect(
          await find({ store, query: { "payload.name": hostile } }),
        ).to.deep.equal([]);
      expect(
        await find({ store, query: { [`payload.${key}`]: value } }),
      ).to.deep.equal([quoted]);
      // Object equality sends the same hostile text as a JSONB parameter.
      expect(
        await find({ store, query: { payload: { [key]: value } } }),
      ).to.deep.equal([quoted]);
      await expectIntact();
    });

    it("should reject unsupported operators, sorts and projections instead of compiling them", async () => {
      for (const options of [
        { query: { $where: "pg_sleep(0)" } },
        { query: { $or: [{ hash: "x" }] } },
        { query: { 'hash" IS NOT NULL OR "hash': "x" } },
        { query: { "headers.root": { $ne: "x" } } },
        { query: { "headers.number": { "$gt; DROP TABLE events; --": 0 } } },
        { query: { "payload.name": { $regex: ".*" } } },
        { query: { "payload.$where": "x" } },
        { sort: { "number; DROP TABLE events; --": 1 } },
        { sort: { "headers.number": "ASC; DROP TABLE events" } },
      ]) {
        expect(
          await failure(() => find({ store: main.eventStore, ...options })),
        ).to.be.instanceOf(TypeError);
        expect(
          await failure(() =>
            stream({ store: main.eventStore, ...options, fn: () => {} }),
          ),
        ).to.be.instanceOf(TypeError);
      }
      // Only find accepts a projection; stream has none to compile.
      expect(
        await failure(() =>
          find({
            store: main.eventStore,
            select: { "doc FROM events; --": 1 },
          }),
        ),
      ).to.be.instanceOf(TypeError);
      for (const select of [
        { "events, (SELECT 1)": 0 },
        { events: "0; DROP TABLE events" },
        { "headers.root": "1" },
      ])
        expect(
          await failure(() => find({ store: main.snapshotStore, select })),
        ).to.be.instanceOf(TypeError);
      expect(
        await failure(() =>
          pending(main, { sort: { "updated; DROP TABLE counts": 1 } }),
        ),
      ).to.be.instanceOf(TypeError);
      await expectIntact();
    });
  });

  describe("constraints", () => {
    it("should enforce event hash, nonce, idempotency and root-number uniqueness", async () => {
      const store = main.eventStore;
      const first = event("root", 0);
      await create({ store, data: [first] });
      for (const [constraint, conflict] of [
        ["events_pkey", event("other", 0, { hash: first.hash })],
        [
          "events_nonce_key",
          event("other", 0, { headers: { nonce: first.headers.nonce } }),
        ],
        [
          "events_idempotency_key",
          event("other", 0, {
            headers: { idempotency: first.headers.idempotency },
          }),
        ],
        ["events_root_number_key", event("root", 0)],
      ])
        await violation(() => create({ store, data: [conflict] }), constraint);
      expect(await all(store)).to.deep.equal([first]);
    });

    it("should enforce snapshot, block and publication uniqueness while upserting by hash", async () => {
      const taken = snapshot("root", 0);
      await save({ store: main.snapshotStore, data: taken });
      await violation(
        () =>
          save({
            store: main.snapshotStore,
            data: snapshot("other", 0, {
              headers: { nonce: taken.headers.nonce },
            }),
          }),
        "snapshots_nonce_key",
      );
      await violation(
        () => save({ store: main.snapshotStore, data: snapshot("root", 0) }),
        "snapshots_root_number_key",
      );
      const replaced = {
        ...taken,
        state: { replaced: true },
        events: Buffer.from([9]),
      };
      expect(
        await save({ store: main.snapshotStore, data: replaced }),
      ).to.deep.equal(replaced);
      expect(await all(main.snapshotStore)).to.deep.equal([replaced]);

      const mined = block(0);
      await save({ store: main.blockchainStore, data: mined });
      await violation(
        () => save({ store: main.blockchainStore, data: block(0) }),
        "blockchain_number_key",
      );
      const moved = { ...mined, headers: { ...mined.headers, number: 1 } };
      await save({ store: main.blockchainStore, data: moved });
      expect(await all(main.blockchainStore)).to.deep.equal([moved]);

      const queued = notice();
      await create({ store: main.publicationsStore, data: [queued] });
      await violation(
        () =>
          create({
            store: main.publicationsStore,
            data: [notice({ hash: queued.hash })],
          }),
        "publications_pkey",
      );
      expect(
        await findPublications({ store: main.publicationsStore, limit: 10 }),
      ).to.deep.equal([queued]);
    });

    it("should hold numbers and counters within the safe integer range", async () => {
      const max = Number.MAX_SAFE_INTEGER;
      for (const number of [-1, max + 1])
        for (const write of [
          () =>
            create({ store: main.eventStore, data: [event("low", number)] }),
          () =>
            save({ store: main.snapshotStore, data: snapshot("low", number) }),
          () => save({ store: main.blockchainStore, data: block(number) }),
          () => count(main.countsStore, "low", number),
        ])
          expect((await failure(write)).code).to.equal("23514");
      // A fraction is not an integer at all.
      expect(
        (
          await failure(() =>
            create({ store: main.eventStore, data: [event("low", 1.5)] }),
          )
        ).code,
      ).to.match(/^22/);

      const stored = {
        eventStore: event("high", max),
        snapshotStore: snapshot("high", max),
        blockchainStore: block(max),
      };
      await create({ store: main.eventStore, data: [stored.eventStore] });
      await save({ store: main.snapshotStore, data: stored.snapshotStore });
      await save({ store: main.blockchainStore, data: stored.blockchainStore });
      await count(main.countsStore, "high", max);
      for (const [name, document] of Object.entries(stored))
        expect(
          await all(main[name], { query: { "headers.number": max } }),
        ).to.deep.equal([document]);
      expect(await all(main.eventStore)).to.have.length(1);
      expect(await all(main.countsStore)).to.deep.equal([
        { root: "high", value: max, updated: created },
      ]);
    });

    it("should insert none of a multi-row batch when one row conflicts", async () => {
      const store = main.eventStore;
      const existing = event("root", 0);
      await create({ store, data: [existing] });
      await violation(
        () =>
          create({
            store,
            data: [
              event("root", 1),
              event("root", 2, {
                headers: { idempotency: existing.headers.idempotency },
              }),
              event("root", 3),
            ],
          }),
        "events_idempotency_key",
      );
      // Rows of one statement conflict with each other too.
      await violation(
        () => create({ store, data: [event("fresh", 0), event("fresh", 0)] }),
        "events_root_number_key",
      );
      expect(await all(store)).to.deep.equal([existing]);

      const batch = [event("root", 1), event("root", 2)];
      expect(await create({ store, data: batch })).to.deep.equal(batch);
      expect(await all(store, { sort: { "headers.number": 1 } })).to.deep.equal(
        [existing, ...batch],
      );
    });
  });

  describe("document round trips", () => {
    const text = 'значение 😀 é é   \u007f \u0001 " \\ \n \t';
    const rich = {
      nested: {
        deep: {
          list: [1, "two", null, true, false, { empty: [] }, [[]]],
          empty: {},
        },
      },
      numbers: [
        0,
        -1.5,
        0.1,
        1e-7,
        1e21,
        Number.MAX_SAFE_INTEGER,
        Number.MAX_VALUE,
        Number.MIN_VALUE,
      ],
      "": "empty key",
      "ключ 🔑": text,
      date: created,
    };

    it("should return nested, scalar, null, array and Unicode JSON exactly as stored", async () => {
      const store = main.eventStore;
      const events = [
        null,
        0,
        "",
        false,
        [],
        {},
        [null, [1], { a: null }],
        rich,
      ].map((payload, number) => event("json", number, { payload }));
      expect(await create({ store, data: events })).to.deep.equal(events);
      expect(await all(store, { sort: { "headers.number": 1 } })).to.deep.equal(
        events,
      );
      expect(
        await collect(stream, { store, sort: { "headers.number": 1 } }),
      ).to.deep.equal(events);
      expect(
        await find({ store, query: { "payload.ключ 🔑": text } }),
      ).to.deep.equal([events.at(-1)]);

      const queued = notice({ data: rich });
      await create({ store: main.publicationsStore, data: [queued] });
      expect(
        await findPublications({ store: main.publicationsStore, limit: 10 }),
      ).to.deep.equal([queued]);

      // JSONB text cannot hold U+0000 or an unpaired surrogate. Such a
      // document is rejected whole; nothing is stored or silently altered.
      for (const unsupported of ["a\u0000b", "a\ud800b"])
        expect(
          (
            await failure(() =>
              create({
                store,
                data: [event("json", 99, { payload: { unsupported } })],
              }),
            )
          ).code,
        ).to.match(/^22/);
      expect(await all(store)).to.have.length(events.length);
    });

    it("should return snapshot and block bytes as identical Buffers and omit them from projections", async () => {
      const bytes = Buffer.from(Array.from({ length: 256 }, (_, i) => i));
      // Incompressible and large enough to be stored out of line.
      const large = Buffer.concat([bytes, randomBytes(8192)]);
      const empty = Buffer.alloc(0);

      const store = main.snapshotStore;
      const full = snapshot("binary", 0, { state: rich, events: large });
      const hollow = snapshot("binary", 1, { events: empty });
      expect(await save({ store, data: full })).to.deep.equal(full);
      expect(await save({ store, data: hollow })).to.deep.equal(hollow);
      const sort = { "headers.number": 1 };
      const found = await all(store, { sort });
      expect(found).to.deep.equal([full, hollow]);
      for (const { events } of found)
        expect(Buffer.isBuffer(events)).to.equal(true);
      expect(await collect(stream, { store, sort })).to.deep.equal([
        full,
        hollow,
      ]);

      const projected = await all(store, { sort, select: { events: 0 } });
      expect(projected).to.deep.equal([
        without(full, "events"),
        without(hollow, "events"),
      ]);
      for (const document of projected)
        expect(document).not.to.have.property("events");
      expect(
        await all(store, { sort, select: { "headers.root": 1 } }),
      ).to.deep.equal([
        { headers: { root: "binary" } },
        { headers: { root: "binary" } },
      ]);

      const mined = block(0, { events: bytes, snapshots: empty, txs: large });
      expect(
        await save({ store: main.blockchainStore, data: mined }),
      ).to.deep.equal(mined);
      const [read] = await all(main.blockchainStore);
      expect(read).to.deep.equal(mined);
      for (const key of ["events", "snapshots", "txs"])
        expect(Buffer.isBuffer(read[key])).to.equal(true);
    });
  });

  describe("pending roots and read semantics", () => {
    it("should exclude snapshot-covered and empty roots before ordering and limiting", async () => {
      const covering = (root, number, lastEventNumber, minute) =>
        save({
          store: main.snapshotStore,
          data: snapshot(root, number, {
            headers: { lastEventNumber, created: at(minute) },
          }),
        });
      // Covered and empty roots sort first, so a limit applied before the
      // coverage filter would return too few pending roots.
      await count(main.countsStore, "empty", 0, at(0));
      await count(main.countsStore, "covered", 5, at(1));
      await covering("covered", 0, 4, 0);
      await count(main.countsStore, "latest", 5, at(2));
      // The highest-numbered snapshot wins, even when created earlier.
      await covering("latest", 0, 1, 9);
      await covering("latest", 1, 4, 0);
      await count(main.countsStore, "fresh", 1, at(3));
      await count(main.countsStore, "behind", 6, at(4));
      await covering("behind", 0, 4, 0);
      await count(main.countsStore, "later", 2, at(5));
      // Another root's snapshot covers nothing here.
      await covering("unrelated", 0, 99, 0);

      const fresh = { root: "fresh", value: 1, updated: at(3) };
      const behind = { root: "behind", value: 6, updated: at(4) };
      const later = { root: "later", value: 2, updated: at(5) };
      const sort = { updated: 1, root: 1 };

      expect(await pending(main, { sort, limit: 2 })).to.deep.equal([
        fresh,
        behind,
      ]);
      for (const limit of [undefined, null])
        expect(await pending(main, { sort, limit })).to.deep.equal([
          fresh,
          behind,
          later,
        ]);
      expect(await pending(main, { sort, limit: 0 })).to.deep.equal([]);
      expect(
        await pending(main, {
          query: { updated: { $gte: at(4), $lt: at(6) } },
          sort,
        }),
      ).to.deep.equal([behind, later]);
      expect(
        await pending(main, {
          query: { updated: { $gt: at(3), $lte: at(4) } },
          sort,
        }),
      ).to.deep.equal([behind]);
      expect(
        await pending(main, { sort: { updated: -1 }, limit: 1 }),
      ).to.deep.equal([later]);
      expect(await pending(main, { query: { root: "covered" } })).to.deep.equal(
        [],
      );

      // One more event than the snapshot covers makes a root pending again.
      await database.query(
        `UPDATE ${main.countsStore.table} SET value = 6 WHERE root = 'covered'`,
      );
      expect(await pending(main, { query: { root: "covered" } })).to.deep.equal(
        [{ root: "covered", value: 6, updated: at(1) }],
      );
    });

    it("should apply numeric and time ranges, typed sorting and null, zero and default limits", async () => {
      const store = main.eventStore;
      const ranged = [0, 1, 2, 3, 10].map((number) =>
        event("range", number, { headers: { created: at(number) } }),
      );
      const noise = event("noise", 2, { headers: { created: at(2) } });
      await create({ store, data: [...ranged, noise] });
      const numbers = async (options) =>
        (await find({ store, ...options })).map(
          ({ headers }) => `${headers.root}:${headers.number}`,
        );

      // Numeric, not lexical: 10 follows 3.
      expect(
        await numbers({
          query: { "headers.root": "range" },
          sort: { "headers.number": 1 },
        }),
      ).to.deep.equal(["range:0", "range:1", "range:2", "range:3", "range:10"]);
      expect(
        await numbers({
          query: {
            "headers.root": "range",
            "headers.number": { $gt: 0, $lte: 3 },
          },
          sort: { "headers.number": -1 },
        }),
      ).to.deep.equal(["range:3", "range:2", "range:1"]);
      expect(
        await numbers({
          query: {
            $and: [
              { "headers.created": { $gte: at(2) } },
              { "headers.created": { $lt: at(10) } },
            ],
          },
          sort: { "headers.root": 1, "headers.number": -1 },
        }),
      ).to.deep.equal(["noise:2", "range:3", "range:2"]);

      const many = Array.from({ length: 101 }, (_, number) =>
        event("many", number),
      );
      await create({ store, data: many });
      const query = { "headers.root": "many" };
      expect(await find({ store, query })).to.have.length(100);
      expect(await find({ store, query, limit: null })).to.have.length(101);
      expect(await find({ store, query, limit: 0 })).to.deep.equal([]);
      expect(
        await numbers({ query, sort: { "headers.number": -1 }, limit: 1 }),
      ).to.deep.equal(["many:100"]);
      expect(await collect(stream, { store, query })).to.have.length(101);
      expect(await collect(stream, { store, query, limit: 2 })).to.have.length(
        2,
      );
    });
  });
});
