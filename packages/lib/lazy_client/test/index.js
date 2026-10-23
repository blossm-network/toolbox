import assert from "node:assert/strict";
import { replace, restore } from "sinon";
import lazyClient from "../index.js";

describe("Lazy client", () => {
  afterEach(restore);

  it("constructs on first use and forwards methods, writes and reflection", () => {
    let constructions = 0;
    class Client {
      #count = 0;
      constructor() {
        constructions++;
        this.offset = 1;
      }
      add(value) {
        this.#count += value;
        return this.#count + this.offset;
      }
    }
    const client = lazyClient(Client);
    assert.equal(constructions, 0);
    assert(client instanceof Client);
    assert.equal(constructions, 0);
    const add = client.add;
    assert.equal(constructions, 1);
    assert.equal(client.add, add);
    assert.equal(add(2), 3);
    client.offset = 5;
    assert.equal(client.add(1), 8);
    assert.equal(Object.getOwnPropertyDescriptor(client, "offset").value, 5);
    assert(Object.keys(client).includes("offset"));
    assert("offset" in client);
    Object.defineProperty(client, "extra", { value: true, configurable: true });
    assert.equal(client.extra, true);
    delete client.extra;
    assert.equal(client.extra, undefined);
    replace(client, "add", () => "fake");
    assert.equal(client.add(100), "fake");
    restore();
    assert.equal(client.add, add);
    assert.equal(client.add(1), 9);
    assert.equal(constructions, 1);
  });
});
