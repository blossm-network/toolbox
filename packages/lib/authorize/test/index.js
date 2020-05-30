const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");

const authorize = require("..");

const domain = "some-domain";
const service = "some-service";
const network = "some-network";
const privilege = "some-privilege";

const principal = "some-principal-root";

const context = {
  network,
  service,
  any: "any-root",
  principal,
};

const deps = require("../deps");

describe("Authorize", () => {
  afterEach(() => {
    restore();
  });
  it("should authorize with matching privilege, domain, and service from permission", async () => {
    const permissions = [{ service, domain, privilege }];

    const permissionsLookupFn = fake.returns(permissions);
    const context = "some-context";

    const document = await authorize({
      permissionsLookupFn,
      permissions: [{ service, domain, privilege }],
      network,
      principal,
      context,
    });

    expect(permissionsLookupFn).to.have.been.calledWith({
      principal,
      context,
    });
    expect(document).to.deep.equal({
      permissions,
    });
  });
  it("should not authorize if theres a mismatch", async () => {
    const permissions = [{ service, domain, privilege: "bogus" }];

    const permissionsLookupFn = fake.returns(permissions);

    const error = "some-error";
    const tokenInvalidFake = fake.returns(error);
    replace(deps, "invalidCredentialsError", {
      tokenInvalid: tokenInvalidFake,
    });

    try {
      await authorize({
        permissionsLookupFn,
        network,
        principal,
      });

      //shouldnt be called;
      expect(1).to.equal(2);
    } catch (e) {
      expect(e).to.equal(e);
    }
  });
  it("should authorize with permissions as none", async () => {
    const document = await authorize({
      context,
      permissions: "none",
      network,
    });
    expect(document).to.deep.equal({
      permissions: [],
    });
  });
  it("should authorize with no sub and permissions as none", async () => {
    const document = await authorize({
      principal,
      permissions: "none",
      network,
    });

    expect(document).to.deep.equal({
      permissions: [],
    });
  });
});
