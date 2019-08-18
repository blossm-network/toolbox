const { expect } = require("chai");
const { validate } = require("..");

describe("Valid emails", () => {
  it("should not throw when given a valid email", () => {
    const validEmails = [
      "user@domain.io",
      "email@domain.com",
      "firstname.lastname@domain.com",
      "email@subdomain.domain.com",
      "firstname+lastname@domain.com",
      "\"email\"@domain.com",
      "1234567890@domain.com",
      "email@domain-one.com",
      "_______@domain.com",
      "email@domain.name",
      "email@domain.co.jp",
      "firstname-lastname@domain.com"
    ];
    validEmails.forEach(validEmail => {
      expect(() => validate(validEmail)).to.not.throw();
    });
  });
});
describe("Invalid emails", () => {
  it("should throw when given an invalid email", () => {
    const invalidEmails = [
      "plainaddress",
      "#@%^%#$@#$@#.com",
      "@domain.com",
      "Joe Smith <email@domain.com>",
      "email.domain.com",
      "あいうえお@domain.com",
      "email@domain@domain.com",
      ".email@domain.com",
      "email.@domain.com",
      "email..email@domain.com",
      "mail@domain.com (Joe Smith)",
      "email@domain",
      "email@-domain.com",
      "email@domain.web",
      "email@111.222.333.44444",
      "email@domain..com",
      "email@123.123.123.123",
      "email@[123.123.123.123]"
    ];
    invalidEmails.forEach(invalidEmail => {
      expect(() => validate(invalidEmail)).to.throw(
        `${invalidEmail} is not a valid email.`
      );
    });
  });
});
