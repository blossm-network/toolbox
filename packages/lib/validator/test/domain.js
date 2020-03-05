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
});

describe("Invalid domain", () => {
  it("should contain one error if domain is bad", () => {
    const invalidDomains = ["bad"];
    for (const invalidDomain of invalidDomains) {
      const response = domain(invalidDomain);
      expect(response.message).to.exist;
    }
  });
});
