import * as chai from "chai";
import { fake, restore } from "sinon";
import { forEach } from "../index.js";

const { expect } = chai;

const query = "some-query";

describe("For each", () => {
  afterEach(() => {
    restore();
  });

  it("it should return the correct result", async () => {
    const data = "some-data";
    const on = (param, fn) => {
      switch (param) {
        case "data":
          fn(data);
          return { on };
        case "error":
          return { on };
        case "end":
          return fn();
      }
    };
    const cursorFake = fake.returns({
      on,
    });
    const findFake = fake.returns({
      cursor: cursorFake,
    });
    const store = {
      find: findFake,
    };

    const fnFake = fake();

    const result = await forEach({ store, query, fn: fnFake });

    expect(findFake).to.have.been.calledWith(query);
    expect(result).to.be.undefined;
    expect(fnFake).to.have.been.calledWith(data);
  });
});

describe("Throws", () => {
  it("it should throw if an error function is passed", async () => {
    const error = new Error("no good");
    const data = "some-data";
    const on = (param, fn) => {
      switch (param) {
        case "data":
          fn(data);
          return { on };
        case "error":
          fn(error);
          return { on };
        case "end":
          return fn();
      }
    };
    const cursorFake = fake.returns({
      on,
    });
    const findFake = fake.returns({
      cursor: cursorFake,
    });
    const store = {
      find: findFake,
    };

    const fnFake = fake();

    try {
      await forEach({ store, query, fn: fnFake });

      //shouldn't get called
      expect(1).to.equal(0);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
