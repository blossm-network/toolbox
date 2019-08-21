const { expect } = require("chai");
const eventTopic = require("../src/event_topic");

describe("Version", () => {
  it("should have the correct version", async () => {
    expect(eventTopic.event).to.equal("created");
    expect(eventTopic.domain).to.equal("auth-token");
  });
});
