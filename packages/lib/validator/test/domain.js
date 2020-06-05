const { expect } = require("chai");
const { domain } = require("..");

describe("Domain", () => {
  it("should not contain errors if the domain is formatted correctly", () => {
    const validDomains = ["valid.domain", "another.valid.domain"];
    for (const validDomain of validDomains) {
      const error = domain(validDomain);
      expect(error).to.be.undefined;
    }
  });

  it("should not contain errors if the domain is formatted correctly and passes the function", () => {
    const validDomains = ["valid.domain", "another.valid.domain"];
    for (const validDomain of validDomains) {
      const error = domain(validDomain, { fn: () => true });
      expect(error).to.be.undefined;
    }
  });
});

describe("Invalid domain", () => {
  it("should contain one error if domain is bad", () => {
    const invalidDomains = ["bad", "other-bad"];
    for (const invalidDomain of invalidDomains) {
      const response = domain(invalidDomain);
      expect(response.message).to.exist;
    }
  });
  it("should contain one error if it fails the function", () => {
    const validDomains = ["valid.domain", "another.valid.domain"];
    for (const validDomain of validDomains) {
      const response = domain(validDomain, { fn: () => false });
      expect(response.message).to.exist;
    }
  });
});
