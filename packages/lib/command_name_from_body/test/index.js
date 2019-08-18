const { expect } = require("chai");
const commandNameFromReqHost = require("..");

describe("Command name from req host", () => {
  it("should return the correct command name.", () => {
    const command = "some-command-name";
    const req = {
      get: param => {
        if (param == "host") return `${command}.command.domain.io`;
        return null;
      }
    };
    expect(commandNameFromReqHost(req)).to.equal(command);
  });
  it("should return null if there is no command.", () => {
    const command = "some-command-name";
    const req = {
      get: param => {
        if (param == "host") return `${command}.bogus.domain.io`;
        return null;
      }
    };
    expect(commandNameFromReqHost(req)).to.be.null;
  });
  it("should return null if the host is not formatted as expected.", () => {
    const command = "some-command-name";
    const req = {
      get: param => {
        if (param == "host") return `${command}`;
        return null;
      }
    };
    expect(commandNameFromReqHost(req)).to.be.null;
  });
});
