import { expect } from "chai";
import createPublication from "../index.js";

describe("Event publication", () => {
  it("uses committed event identity and routing without exposing its payload", () => {
    const headers = Object.freeze({
      root: "root",
      action: "set",
      domain: "domain",
      service: "service",
      network: "network",
      topic: "topic",
      committed: "2026-11-09T12:00:00.000Z",
    });
    const event = Object.freeze({ hash: "hash", headers, payload: { private: true } });
    expect(createPublication(event)).to.deep.equal({
      hash: "hash",
      topic: "topic",
      created: headers.committed,
      data: { root: "root", action: "set", domain: "domain", service: "service", network: "network", timestamp: headers.committed },
    });
  });
});
