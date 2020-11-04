const { expect } = require("chai");
const formatUpdate = require("..");

describe("Format update", () => {
  it("should return the composed update with two parts", () => {
    const query = {
      "some.thing-id": "some-thing-id",
      "some.sub.thing-id": "some-sub-thing-id",
      "a.b": "c",
    };
    const update = {
      "some.things": [
        {
          id: "some-thing-id",
          some: "value",
        },
      ],
      "some.things.$.some-other": "other-value",
      a: {
        b: "c",
      },
      "a.d": "e",
    };

    const result = formatUpdate(update, query, ".$.");
    expect(result).to.deep.equal({
      "some.things": [
        { id: "some-thing-id", some: "value", "some-other": "other-value" },
      ],
      a: {
        b: "c",
        d: "e",
      },
    });
  });
  it("should return the composed update with three parts", () => {
    const query = {
      "things.id": "some-thing-id",
      "things.subthings.id": "some-subthing-id",
    };
    const update = {
      "things.$.name": "some-thing-name",
      "things.$.subthings": [
        {
          id: "some-subthing-id",
          some: "value",
        },
      ],
      "things.subthings.$.some-other": "other-value",
      a: {
        b: "c",
      },
      "a.d": "e",
      "w.x": {
        y: "z",
      },
      "w.x.c": "e",
    };

    const result = formatUpdate(update, query, ".$.");
    expect(result).to.deep.equal({
      "things.$.name": "some-thing-name",
      "things.$.subthings": [
        {
          id: "some-subthing-id",
          some: "value",
          "some-other": "other-value",
        },
      ],
      a: {
        b: "c",
        d: "e",
      },
      "w.x": {
        y: "z",
        c: "e",
      },
    });
  });
  it("should return the composed update with three parts in different array order", () => {
    const query = {
      "things.id": "some-thing-id",
      "things.subthings.id": "some-subthing-id",
    };
    const update = {
      "things.$.name": "some-thing-name",
      "things.subthings.$.some-other": "other-value",
      "things.$.subthings": [
        {
          id: "some-subthing-id",
          some: "value",
        },
      ],
    };

    const result = formatUpdate(update, query, ".$.");
    expect(result).to.deep.equal({
      "things.$.name": "some-thing-name",
      "things.$.subthings": [
        {
          id: "some-subthing-id",
          some: "value",
          "some-other": "other-value",
        },
      ],
    });
  });
  it("should return the composed update with four parts", () => {
    const query = {
      "things.id": "some-thing-id",
      "things.subthings.id": "some-subthing-id",
    };
    const update = {
      things: [{ id: "some-thing-id" }],
      "things.$.name": "some-thing-name",
      "things.$.subthings": [
        {
          id: "some-subthing-id",
          some: "value",
        },
      ],
      "things.subthings.$.some-other": "other-value",
    };

    const result = formatUpdate(update, query, ".$.");
    expect(result).to.deep.equal({
      things: [
        {
          id: "some-thing-id",
          name: "some-thing-name",
          subthings: [
            {
              id: "some-subthing-id",
              some: "value",
              "some-other": "other-value",
            },
          ],
        },
      ],
    });
  });
  it("should return the composed update with four parts and many subparts", () => {
    const query = {
      "things.id": "some-thing-id",
      "things.subthings.id": "some-subthing-id",
    };
    const update = {
      things: [
        { id: "some-thing-id" },
        { id: "some-other-thing-id", a: "random-value" },
      ],
      "things.$.name": "some-thing-name",
      "things.$.subthings": [
        {
          id: "some-subthing-id",
          some: "value",
        },
        {
          id: "some-other-subthing-id",
          x: "other-random-value",
        },
      ],
      "things.subthings.$.some-other": "other-value",
    };

    const result = formatUpdate(update, query, ".$.");
    expect(result).to.deep.equal({
      things: [
        {
          id: "some-thing-id",
          name: "some-thing-name",
          subthings: [
            {
              id: "some-subthing-id",
              some: "value",
              "some-other": "other-value",
            },
            {
              id: "some-other-subthing-id",
              x: "other-random-value",
            },
          ],
        },
        {
          id: "some-other-thing-id",
          a: "random-value",
        },
      ],
    });
  });
});
