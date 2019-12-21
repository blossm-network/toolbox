const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");

const authorize = require("..");

const service = "some-service";
const network = "some-network";
const domain = "some-domain";
const root = "some-root";
const priviledges = ["some-priviledges"];
const path = "some-path";

const joinedPriviledges = priviledges.join(",");

const principle = "some-priciple-root";

const context = {
  network,
  service,
  any: "any-root"
};

const claims = {
  context,
  principle
};

const deps = require("../deps");

describe("Authorize", () => {
  afterEach(() => {
    restore();
  });
  it("should authorize all wildcards", async () => {
    const permissions = ["*:*:*"];

    const permissionsLookupFn = fake.returns(permissions);

    const document = await authorize({
      path,
      claims,
      permissionsLookupFn,
      priviledges,
      root,
      domain,
      service,
      network
    });

    expect(permissionsLookupFn).to.have.been.calledWith({ principle, context });
    expect(document).to.deep.equal({
      context: {
        ...context,
        permissions,
        principle
      }
    });
  });
  it("should authorize with no domain", async () => {
    const permissions = [`bogus:${joinedPriviledges}:${root}`];

    const permissionsLookupFn = fake.returns(permissions);

    const document = await authorize({
      path,
      claims,
      permissionsLookupFn,
      priviledges,
      root,
      service,
      network
    });

    expect(permissionsLookupFn).to.have.been.calledWith({ principle, context });
    expect(document).to.deep.equal({
      context: {
        ...context,
        permissions,
        principle
      }
    });
  });
  it("should authorize with matching permission", async () => {
    const permissions = [`${domain}:${joinedPriviledges}:${root}`];

    const permissionsLookupFn = fake.returns(permissions);

    const document = await authorize({
      path,
      claims,
      permissionsLookupFn,
      priviledges,
      root,
      domain,
      service,
      network
    });

    expect(permissionsLookupFn).to.have.been.calledWith({ principle, context });
    expect(document).to.deep.equal({
      context: {
        ...context,
        permissions,
        principle
      }
    });
  });
  it("should authorize with multiple matching permissions", async () => {
    const permissions = [
      `${domain}:${joinedPriviledges}:${root}`,
      `*:${joinedPriviledges}:${root}`,
      `${domain}:*:${root}`,
      `${domain}:${joinedPriviledges}:*`,
      `${domain}:${joinedPriviledges}`,
      `${domain},some-other:*:${root}`,
      `${domain}:${joinedPriviledges},some-other,${joinedPriviledges}:*`,
      `${domain},some-other:${joinedPriviledges}:*`,
      `${domain},some-other:${joinedPriviledges}`
    ];

    const permissionsLookupFn = fake.returns(permissions);

    const document = await authorize({
      path,
      claims,
      permissionsLookupFn,
      priviledges,
      root,
      domain,
      service,
      network
    });

    expect(permissionsLookupFn).to.have.been.calledWith({ principle, context });
    expect(document).to.deep.equal({
      context: {
        ...context,
        permissions,
        principle
      }
    });
  });
  it("should not authorize if theres a mismatch in priviledges", async () => {
    const permissions = [`${domain}:bogus:${root}`];

    const permissionsLookupFn = fake.returns(permissions);

    const error = "some-error";
    const tokenInvalidFake = fake.returns(error);
    replace(deps, "invalidCredentialsError", {
      tokenInvalid: tokenInvalidFake
    });

    try {
      await authorize({
        path,
        claims,
        permissionsLookupFn,
        priviledges,
        root,
        domain,
        service,
        network
      });

      //shouldnt be called;
      expect(1).to.equal(2);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
  it("should not authorize if theres a mismatch in root", async () => {
    const permissions = [`${domain}:${joinedPriviledges}:bogus`];

    const permissionsLookupFn = fake.returns(permissions);

    const error = "some-error";
    const tokenInvalidFake = fake.returns(error);
    replace(deps, "invalidCredentialsError", {
      tokenInvalid: tokenInvalidFake
    });

    try {
      await authorize({
        path,
        claims,
        permissionsLookupFn,
        root,
        domain,
        service,
        network
      });

      //shouldnt be called;
      expect(1).to.equal(2);
    } catch (e) {
      expect(e).to.equal(e);
    }
  });
  it("should not authorize if theres a mismatch in domain", async () => {
    const permissions = [`bogus:${joinedPriviledges}:${root}`];
    const permissionsLookupFn = fake.returns(permissions);

    const error = "some-error";
    const tokenInvalidFake = fake.returns(error);
    replace(deps, "invalidCredentialsError", {
      tokenInvalid: tokenInvalidFake
    });

    try {
      await authorize({
        path,
        claims,
        permissionsLookupFn,
        root,
        domain,
        service,
        network
      });

      //shouldnt be called;
      expect(1).to.equal(2);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
  it("should not authorize if theres a mismatch in service", async () => {
    const permissions = [`${domain}:${joinedPriviledges}:${root}`];
    const permissionsLookupFn = fake.returns(permissions);

    const error = "some-error";
    const tokenInvalidFake = fake.returns(error);
    replace(deps, "invalidCredentialsError", {
      tokenInvalid: tokenInvalidFake
    });

    try {
      await authorize({
        path,
        claims,
        permissionsLookupFn,
        root,
        domain,
        service: "bogus",
        network
      });

      //shouldnt be called;
      expect(1).to.equal(2);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
  it("should not authorize if theres a mismatch in network", async () => {
    const permissions = [`${domain}:${joinedPriviledges}:${root}`];
    const permissionsLookupFn = fake.returns(permissions);

    const error = "some-error";
    const tokenInvalidFake = fake.returns(error);
    replace(deps, "invalidCredentialsError", {
      tokenInvalid: tokenInvalidFake
    });

    try {
      await authorize({
        path,
        claims,
        permissionsLookupFn,
        root,
        domain,
        service,
        network: "bogus"
      });

      //shouldnt be called;
      expect(1).to.equal(2);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
  it("should not authorize without priviledges", async () => {
    const permissions = ["*:bogus:*"];

    const permissionsLookupFn = fake.returns(permissions);

    const error = "some-error";
    const tokenInvalidFake = fake.returns(error);
    replace(deps, "invalidCredentialsError", {
      tokenInvalid: tokenInvalidFake
    });

    try {
      await authorize({
        path,
        claims,
        permissionsLookupFn,
        root,
        domain,
        service,
        network
      });

      //shouldnt be called;
      expect(1).to.equal(2);
    } catch (e) {
      expect(e).to.equal(error);
    }
  });
});
