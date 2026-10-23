import { expect } from "chai";
import { EventEmitter } from "node:events";
import { restore, replace, stub } from "sinon";
import deps from "../deps.js";
import { connect, query, createTransaction, stream } from "../index.js";

const client = () => ({
  query: stub().resolves({ rows: [] }),
  release: stub(),
});
const pool = (...clients) => {
  const database = { query: stub().resolves({ rows: [] }), connect: stub() };
  clients.forEach((value, i) => database.connect.onCall(i).resolves(value));
  return database;
};
const rejection = async (fn) => {
  try {
    await fn();
  } catch (error) {
    return error;
  }
  throw new Error("Expected rejection");
};

describe("PostgreSQL database", () => {
  let sleep;
  beforeEach(() => {
    sleep = stub().resolves();
    replace(deps, "sleep", sleep);
  });
  afterEach(restore);

  it("should create a lazy pool from the supplied connection", () => {
    const database = new EventEmitter();
    const Pool = stub().returns(database);
    replace(deps, "Pool", Pool);
    const connection = { host: "localhost", max: 2 };
    expect(connect(connection)).to.equal(database);
    expect(Pool.calledOnceWithExactly(connection)).to.equal(true);
  });

  it("should log idle pool errors without throwing an unhandled event", () => {
    const database = new EventEmitter();
    replace(deps, "Pool", stub().returns(database));
    const error = stub();
    replace(deps, "logger", { error });
    connect({ connectionString: "postgres://private-connection" });
    const err = new Error("idle connection failed");
    expect(() => database.emit("error", err)).not.to.throw();
    expect(
      error.calledOnceWithExactly("Database has errored.", { err })
    ).to.equal(true);
  });

  it("should pass parameterized queries and results through", async () => {
    const database = pool();
    const result = { rows: [{ id: 1 }] };
    database.query.resolves(result);
    expect(await query({ database, text: "SELECT $1", values: [1] })).to.equal(
      result
    );
    expect(database.query.calledOnceWithExactly("SELECT $1", [1])).to.equal(
      true
    );
    const transaction = client();
    await query({ database, transaction, text: "SELECT 2" });
    expect(transaction.query.calledOnceWithExactly("SELECT 2", [])).to.equal(
      true
    );
  });

  it("should bind implicit queries and nested transactions to the same client", async () => {
    const transaction = client();
    const database = pool(transaction);
    const result = await createTransaction({
      database,
      fn: async (current) => {
        expect(current).to.equal(transaction);
        await query({ database, text: "SELECT 1" });
        return createTransaction({
          database,
          fn: async (nested) => {
            expect(nested).to.equal(current);
            return "result";
          },
        });
      },
    });
    expect(result).to.equal("result");
    expect(transaction.query.args.map(([text]) => text)).to.deep.equal([
      "BEGIN ISOLATION LEVEL REPEATABLE READ",
      "SELECT 1",
      "COMMIT",
    ]);
    expect(transaction.release.calledOnceWithExactly(false)).to.equal(true);
    expect(database.connect.calledOnce).to.equal(true);
    expect(sleep.called).to.equal(false);
    await query({ database, text: "SELECT outside" });
    expect(database.query.calledOnce).to.equal(true);
  });

  it("should isolate concurrent transaction contexts", async () => {
    const first = client();
    const second = client();
    const database = pool(first, second);
    let entered;
    const ready = new Promise((resolve) => {
      entered = resolve;
    });
    let release;
    const wait = new Promise((resolve) => {
      release = resolve;
    });
    const a = createTransaction({
      database,
      fn: async () => {
        entered();
        await wait;
        await query({ database, text: "first" });
      },
    });
    await ready;
    await createTransaction({
      database,
      fn: async () => {
        await query({ database, text: "second" });
      },
    });
    release();
    await a;
    expect(first.query.calledWithExactly("first", [])).to.equal(true);
    expect(first.query.calledWith("second")).to.equal(false);
    expect(second.query.calledWithExactly("second", [])).to.equal(true);
  });

  it("should retain an outer database context while another database is active", async () => {
    const first = client();
    const second = client();
    const a = pool(first);
    const b = pool(second);
    await createTransaction({
      database: a,
      fn: () =>
        createTransaction({
          database: b,
          fn: async () => {
            await query({ database: a, text: "outer" });
            await query({ database: b, text: "inner" });
          },
        }),
    });
    expect(first.query.calledWithExactly("outer", [])).to.equal(true);
    expect(second.query.calledWithExactly("inner", [])).to.equal(true);
  });

  for (const code of ["40001", "40P01"]) {
    it(`should retry ${code} after rollback with a fresh transaction`, async () => {
      const first = client();
      const second = client();
      const database = pool(first, second);
      const error = Object.assign(new Error("retry"), { code });
      const fn = stub()
        .onFirstCall()
        .rejects(error)
        .onSecondCall()
        .resolves(42);
      expect(await createTransaction({ database, fn })).to.equal(42);
      expect(first.query.args.map(([text]) => text)).to.deep.equal([
        "BEGIN ISOLATION LEVEL REPEATABLE READ",
        "ROLLBACK",
      ]);
      expect(first.release.calledOnceWithExactly(false)).to.equal(true);
      expect(sleep.calledOnce).to.equal(true);
      expect(sleep.firstCall.args[0]).to.be.at.least(10).and.below(30);
      expect(first.release.calledBefore(sleep)).to.equal(true);
      expect(second.query.lastCall.args).to.deep.equal(["COMMIT"]);
    });
  }

  it("should stop retrying after five attempts with bounded backoff", async () => {
    const clients = Array.from({ length: 5 }, client);
    const database = pool(...clients);
    const error = Object.assign(new Error("retry"), { code: "40001" });
    const fn = stub().rejects(error);
    expect(await rejection(() => createTransaction({ database, fn }))).to.equal(
      error
    );
    expect(fn.callCount).to.equal(5);
    expect(clients.every(({ release }) => release.calledOnce)).to.equal(true);
    expect(sleep.callCount).to.equal(4);
    sleep.args.forEach(([delay], i) => {
      expect(delay)
        .to.be.at.least(10 * 2 ** i)
        .and.below(10 * 2 ** i + 20);
    });
  });

  it("should preserve the original failure, discard on failed rollback and never retry", async () => {
    const transaction = client();
    transaction.query.withArgs("ROLLBACK").rejects(new Error("disconnected"));
    const database = pool(transaction);
    const error = Object.assign(new Error("write failure"), { code: "40001" });
    expect(
      await rejection(() =>
        createTransaction({
          database,
          fn: async () => {
            throw error;
          },
        })
      )
    ).to.equal(error);
    expect(database.connect.calledOnce).to.equal(true);
    expect(transaction.release.calledOnceWithExactly(true)).to.equal(true);
    expect(sleep.called).to.equal(false);
  });

  it("should not repeat work after an uncertain commit", async () => {
    const transaction = client();
    const error = Object.assign(new Error("commit disconnected"), {
      code: "40001",
    });
    transaction.query.withArgs("COMMIT").rejects(error);
    const database = pool(transaction);
    const fn = stub().resolves();
    expect(await rejection(() => createTransaction({ database, fn }))).to.equal(
      error
    );
    expect(fn.calledOnce).to.equal(true);
    expect(transaction.release.calledOnceWithExactly(true)).to.equal(true);
    expect(sleep.called).to.equal(false);
  });

  it("should rollback ordinary callback errors without retrying or delaying", async () => {
    const transaction = client();
    const database = pool(transaction);
    const error = new Error("application failure");
    expect(
      await rejection(() =>
        createTransaction({
          database,
          fn: async () => {
            throw error;
          },
        })
      )
    ).to.equal(error);
    expect(transaction.query.lastCall.args).to.deep.equal(["ROLLBACK"]);
    expect(transaction.release.calledOnceWithExactly(false)).to.equal(true);
    expect(sleep.called).to.equal(false);
  });

  it("should release a failed BEGIN and preserve acquisition errors", async () => {
    const transaction = client();
    const error = new Error("begin failed");
    transaction.query.onFirstCall().rejects(error);
    const database = pool(transaction);
    expect(
      await rejection(() => createTransaction({ database, fn: stub() }))
    ).to.equal(error);
    expect(transaction.release.calledOnce).to.equal(true);
    database.connect.rejects(error);
    expect(
      await rejection(() => createTransaction({ database, fn: stub() }))
    ).to.equal(error);
  });

  it("should stream bounded batches in order, honor the limit, and allow nested queries", async () => {
    const transaction = client();
    transaction.query.onCall(2).resolves({ rows: [{ n: 1 }, { n: 2 }] });
    const database = pool(transaction);
    const seen = [];
    await stream({
      database,
      text: "SELECT n WHERE n > $1",
      values: [0],
      limit: 2,
      fn: async ({ n }) => {
        await query({ database, text: "nested", values: [n] });
        seen.push(n);
      },
    });
    expect(seen).to.deep.equal([1, 2]);
    expect(database.query.called).to.equal(false);
    const texts = transaction.query.args.map(([text]) => text);
    expect(texts[1]).to.match(
      /^DECLARE blossm_cursor_\d+ NO SCROLL CURSOR FOR SELECT n WHERE n > \$1$/
    );
    expect(transaction.query.args[1][1]).to.deep.equal([0]);
    expect(texts[2]).to.match(/^FETCH FORWARD 2 /);
    expect(texts[texts.length - 2]).to.match(/^CLOSE /);
    expect(texts[texts.length - 1]).to.equal("COMMIT");
  });

  it("should fetch at most 100 rows at a time and stop at end of cursor", async () => {
    const transaction = client();
    transaction.query.onCall(2).resolves({ rows: [{ n: 1 }] });
    const database = pool(transaction);
    await stream({ database, text: "SELECT n", fn: stub().resolves() });
    expect(
      transaction.query.args
        .filter(([text]) => text.startsWith("FETCH"))
        .map(([text]) => text.split(" ")[2])
    ).to.deep.equal(["100", "100"]);
  });

  it("should accept parallelism from a request query string without skipping rows", async () => {
    const transaction = client();
    transaction.query.onCall(2).resolves({ rows: [1, 2, 3, 4, 5] });
    const database = pool(transaction);
    const seen = [];
    await stream({
      database,
      text: "SELECT n",
      parallel: "2",
      fn: async (n) => seen.push(n),
    });
    expect(seen).to.deep.equal([1, 2, 3, 4, 5]);
  });

  it("should keep request parallelism at least one so the cursor always advances", async () => {
    for (const parallel of ["0", "-1", ""]) {
      const transaction = client();
      transaction.query.onCall(2).resolves({ rows: [1, 2] });
      const seen = [];
      await stream({
        database: pool(transaction),
        text: "SELECT n",
        parallel,
        fn: (n) => seen.push(n),
      });
      expect(seen).to.deep.equal([1, 2]);
    }
  });

  it("should drain bounded concurrent callbacks before rollback on synchronous failure", async () => {
    const transaction = client();
    transaction.query
      .onCall(2)
      .resolves({ rows: [{ n: 1 }, { n: 2 }, { n: 3 }] });
    const error = new Error("callback failed");
    let finished = false;
    const seen = [];
    const database = pool(transaction);
    const failure = await rejection(() =>
      stream({
        database,
        text: "SELECT n",
        parallel: 2,
        fn: ({ n }) => {
          seen.push(n);
          if (n === 1) throw error;
          return new Promise((resolve) =>
            setImmediate(() => {
              finished = true;
              resolve();
            })
          );
        },
      })
    );
    expect(failure).to.equal(error);
    expect(finished).to.equal(true);
    expect(seen).to.deep.equal([1, 2]);
    expect(transaction.query.args.map(([text]) => text).slice(-2)[0]).to.match(
      /^CLOSE /
    );
    expect(transaction.query.lastCall.args).to.deep.equal(["ROLLBACK"]);
  });

  it("should preserve callback failure when closing the cursor also fails", async () => {
    const transaction = client();
    transaction.query.onCall(2).resolves({ rows: [1] });
    transaction.query.callsFake(async (text) => {
      if (text.startsWith("CLOSE")) throw new Error("close failure");
      return { rows: [] };
    });
    transaction.query.onCall(2).resolves({ rows: [1] });
    const error = new Error("callback failure");
    const database = pool(transaction);
    expect(
      await rejection(() =>
        stream({
          database,
          text: "SELECT 1",
          fn: () => {
            throw error;
          },
        })
      )
    ).to.equal(error);
    expect(transaction.release.calledOnce).to.equal(true);
  });

  it("should stream inside explicit transactions without committing and bind nested queries", async () => {
    const transaction = client();
    transaction.query.onCall(1).resolves({ rows: [1] });
    const database = pool();
    await stream({
      database,
      transaction,
      text: "SELECT 1",
      limit: 1,
      fn: () => query({ database, text: "nested" }),
    });
    expect(database.connect.called).to.equal(false);
    expect(database.query.called).to.equal(false);
    expect(transaction.query.calledWithExactly("nested", [])).to.equal(true);
    expect(transaction.query.calledWith("COMMIT")).to.equal(false);
    expect(transaction.release.called).to.equal(false);
  });

  it("should propagate a cursor close failure and rollback the owned transaction", async () => {
    const transaction = client();
    const error = new Error("close failed");
    transaction.query.callsFake(async (text) => {
      if (text.startsWith("CLOSE")) throw error;
      return { rows: [] };
    });
    const database = pool(transaction);
    expect(
      await rejection(() => stream({ database, text: "SELECT 1", fn: stub() }))
    ).to.equal(error);
    expect(transaction.query.lastCall.args).to.deep.equal(["ROLLBACK"]);
    expect(transaction.release.calledOnceWithExactly(false)).to.equal(true);
  });

  it("should close after a fetch failure without replaying an owned stream", async () => {
    const transaction = client();
    const error = Object.assign(new Error("serialization failure"), {
      code: "40001",
    });
    transaction.query.onCall(2).rejects(error);
    const database = pool(transaction);
    const fn = stub();
    expect(
      await rejection(() => stream({ database, text: "SELECT 1", fn }))
    ).to.equal(error);
    expect(transaction.query.args.map(([text]) => text).slice(-2)[0]).to.match(
      /^CLOSE /
    );
    expect(database.connect.calledOnce).to.equal(true);
    expect(fn.called).to.equal(false);
    expect(sleep.called).to.equal(false);
  });
});
