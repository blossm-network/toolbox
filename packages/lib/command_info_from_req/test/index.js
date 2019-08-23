const { expect } = require("chai");
const commandInfoFromReqHost = require("..");

describe("Command name from req host", () => {
  it("should return the correct command name.", () => {
    const action = "some-command-action";
    const domain = "some-domain-name";
    const service = "some-service-name";
    const req = {
      get: param => {
        if (param == "host") return `${action}.${domain}.${service}.domain.io`;
        return null;
      }
    };
    expect(commandInfoFromReqHost(req)).to.deep.equal({
      action,
      domain,
      service
    });
  });
  it("should return null if there are only three subdomains in the host.", () => {
    const action = "some-command-action";
    const domain = "some-domain-name";
    const service = "some-service-name";
    const req = {
      get: param => {
        if (param == "host") return `${action}.${domain}.${service}`;
        return null;
      }
    };
    expect(commandInfoFromReqHost(req)).to.deep.equal({});
  });
  it("should return null if the host is not formatted as expected.", () => {
    const action = "some-command-action";
    const req = {
      get: param => {
        if (param == "host") return `${action}`;
        return null;
      }
    };
    expect(commandInfoFromReqHost(req)).to.deep.equal({});
  });
});
