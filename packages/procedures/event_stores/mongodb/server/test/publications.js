import { expect } from "chai";
import { fake, replace, restore } from "sinon";
import publishPending from "../src/publish_pending.js";
import deps from "../src/pending_deps.js";

describe("Pending event publications", () => {
  afterEach(restore);
  it("keeps failed notices and removes only acknowledged notices", async () => {
    const pending = [
      { hash: "failed", topic: "one", data: {} },
      { hash: "sent", topic: "two", data: {} },
    ];
    const remove = fake.resolves();
    replace(deps, "db", {
      find: fake.resolves(pending),
      remove,
      write: fake.resolves(),
    });
    const failure = new Error("unavailable");
    const publishFn = async (_, topic) => {
      if (topic === "one") throw failure;
    };
    try {
      await publishPending({ publicationsStore: "outbox", publishFn })();
      throw new Error("expected rejection");
    } catch (err) {
      expect(err).to.equal(failure);
    }
    expect(remove.callCount).to.equal(1);
    expect(remove.firstCall.args[0].query).to.deep.equal({ hash: "sent" });
    expect(deps.db.find.firstCall.args[0].limit).to.equal(100);
  });
  it("permits redelivery when acknowledgement succeeds but deletion fails", async () => {
    const notice = { hash: "event", topic: "topic", data: { root: "root" } };
    let failures = 1;
    const publishFn = fake.resolves();
    replace(deps, "db", {
      find: fake.resolves([notice]),
      write: fake.resolves(),
      remove: async () => {
        if (failures--) throw new Error("lost acknowledgement");
      },
    });
    const drain = publishPending({ publicationsStore: "outbox", publishFn });
    try {
      await drain();
      throw new Error("expected rejection");
    } catch (err) {
      expect(err.message).to.equal("lost acknowledgement");
    }
    await drain();
    expect(publishFn.callCount).to.equal(2);
  });
  it("rotates failed entries so a full failed batch cannot starve later publications", async () => {
    const notices = Array.from({ length: 101 }, (_, index) => ({
      hash: `event-${String(index).padStart(3, "0")}`,
      topic: index == 100 ? "good" : "bad",
      created: index,
      attempts: 0,
      data: {},
    }));
    const failure = new Error("retired topic");
    const sent = [];
    replace(deps, "db", {
      find: fake(async ({ sort, limit }) =>
        notices
          .slice()
          .sort((a, b) => {
            for (const [key, direction] of Object.entries(sort)) {
              const left = a[key];
              const right = b[key];
              if (left < right) return -direction;
              if (left > right) return direction;
            }
            return 0;
          })
          .slice(0, limit)
      ),
      remove: fake(async ({ query }) => {
        notices.splice(
          notices.findIndex(({ hash }) => hash == query.hash),
          1
        );
      }),
      write: fake(async ({ query, update, options }) => {
        expect(options.upsert).to.equal(false);
        const notice = notices.find(({ hash }) => hash == query.hash);
        if (notice) notice.attempts += update.$inc.attempts;
      }),
    });
    const drain = publishPending({
      publicationsStore: "outbox",
      publishFn: async (_, topic) => {
        if (topic == "bad") throw failure;
        sent.push(topic);
      },
    });
    for (let i = 0; i < 2; i++) {
      let actual;
      try {
        await drain();
      } catch (err) {
        actual = err;
      }
      expect(actual).to.equal(failure);
    }
    expect(sent).to.deep.equal(["good"]);
    expect(notices.length).to.equal(100);
    expect(deps.db.find.firstCall.args[0].sort).to.deep.equal({
      attempts: 1,
      created: 1,
      hash: 1,
    });
  });

  it("continues after retry metadata failure and preserves the publication error", async () => {
    const failure = new Error("publish failed");
    const publishFn = fake(async (_, topic) => {
      if (topic == "bad") throw failure;
    });
    replace(deps, "db", {
      find: fake.resolves([
        { hash: "bad", topic: "bad" },
        { hash: "good", topic: "good" },
      ]),
      remove: fake.resolves(),
      write: fake.rejects(new Error("database write failed")),
    });
    let actual;
    try {
      await publishPending({ publicationsStore: "outbox", publishFn })();
    } catch (err) {
      actual = err;
    }
    expect(actual).to.equal(failure);
    expect(publishFn.callCount).to.equal(2);
    expect(deps.db.write.callCount).to.equal(1);
    expect(deps.db.remove.callCount).to.equal(1);
  });
});
