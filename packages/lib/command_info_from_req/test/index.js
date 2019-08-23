const { expect } = require("chai");
const commandInfoFromReqHost = require("..");

describe("Command name from req host", () => {
  it("should return the correct command name.", () => {
    const name = "some-command-name";
    const domain = "some-domain-name";
    const service = "some-service-name";
    const req = {
      get: param => {
        if (param == "host") return `${name}.${domain}.${service}.domain.io`;
        return null;
      }
    };
    expect(commandInfoFromReqHost(req)).to.deep.equal({
      name,
      domain,
      service
    });
  });
  it("should return null if there are only three subdomains in the host.", () => {
    const name = "some-command-name";
    const domain = "some-domain-name";
    const service = "some-service-name";
    const req = {
      get: param => {
        if (param == "host") return `${name}.${domain}.${service}`;
        return null;
      }
    };
    expect(commandInfoFromReqHost(req)).to.deep.equal({});
  });
  it("should return null if the host is not formatted as expected.", () => {
    const name = "some-command-name";
    const req = {
      get: param => {
        if (param == "host") return `${name}`;
        return null;
      }
    };
    expect(commandInfoFromReqHost(req)).to.deep.equal({});
  });
});
