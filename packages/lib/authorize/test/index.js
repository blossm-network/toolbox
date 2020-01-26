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

const session = {
  sub: principle
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
      session,
      context,
      permissionsLookupFn,
      permissions: priviledges,
      root,
      domain,
      service,
      network
    });

    expect(permissionsLookupFn).to.have.been.calledWith({ principle, context });
    expect(document).to.deep.equal({
      permissions,
      principle
    });
  });
  it("should authorize with no domain", async () => {
    const permissions = [`bogus:${joinedPriviledges}:${root}`];

    const permissionsLookupFn = fake.returns(permissions);

    const document = await authorize({
      path,
      session,
      context,
      permissionsLookupFn,
      permissions: priviledges,
      root,
      service,
      network
    });

    expect(permissionsLookupFn).to.have.been.calledWith({ principle, context });
    expect(document).to.deep.equal({
      permissions,
      principle
    });
  });
  it("should authorize with matching permission and domain from permission", async () => {
    const permissions = [`some-other-domain:some-other-priviledge`];

    const permissionsLookupFn = fake.returns(permissions);

    const document = await authorize({
      path,
      session,
      context,
      permissionsLookupFn,
      permissions: ["some-other-domain:some-other-priviledge"],
      root,
      service,
      network
    });

    expect(permissionsLookupFn).to.have.been.calledWith({ principle, context });
    expect(document).to.deep.equal({
      permissions,
      principle
    });
  });
  it("should authorize with matching permission, domain, and root from permission", async () => {
    const permissions = [
      `some-other-domain:some-other-priviledge:some-other-root`
    ];

    const permissionsLookupFn = fake.returns(permissions);

    const document = await authorize({
      path,
      session,
      context,
      permissionsLookupFn,
      permissions: ["some-other-domain:some-other-priviledge:some-other-root"],
      root,
      service,
      network
    });

    expect(permissionsLookupFn).to.have.been.calledWith({ principle, context });
    expect(document).to.deep.equal({
      permissions,
      principle
    });
  });
  it("should authorize with matching permission, domain, and root from permission using $ tag", async () => {
    const permissions = [
      `some-other-domain:some-other-priviledge:some-context-root`
    ];

    const permissionsLookupFn = fake.returns(permissions);

    const document = await authorize({
      path,
      session,
      context: {
        ...context,
        "context-param": "some-context-root"
      },
      permissionsLookupFn,
      permissions: ["some-other-domain:some-other-priviledge:$context-param"],
      root,
      service,
      network
    });

    expect(document).to.deep.equal({
      permissions,
      principle
    });
  });
  it("should authorize with matching permission", async () => {
    const permissions = [`${domain}:${joinedPriviledges}:${root}`];

    const permissionsLookupFn = fake.returns(permissions);

    const document = await authorize({
      path,
      session,
      context,
      permissionsLookupFn,
      permissions: priviledges,
      root,
      domain,
      service,
      network
    });

    expect(permissionsLookupFn).to.have.been.calledWith({ principle, context });
    expect(document).to.deep.equal({
      permissions,
      principle
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
      session,
      context,
      permissionsLookupFn,
      permissions: priviledges,
      root,
      domain,
      service,
      network
    });

    expect(permissionsLookupFn).to.have.been.calledWith({ principle, context });
    expect(document).to.deep.equal({
      permissions,
      principle
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
        session,
        context,
        permissionsLookupFn,
        permissions: priviledges,
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
        session,
        context,
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
        session,
        context,
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
        session,
        context,
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
        session,
        context,
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
        session,
        context,
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
  it("should authorize with permissions as none", async () => {
    const permissions = ["*:bogus:*"];

    const permissionsLookupFn = fake.returns(permissions);

    const document = await authorize({
      path,
      session,
      context,
      permissionsLookupFn,
      root,
      permissions: "none",
      domain,
      service,
      network
    });
    expect(document).to.deep.equal({
      permissions: [],
      principle
    });
  });
  it("should authorize with no sub and permissions as none", async () => {
    const document = await authorize({
      path,
      context,
      session: {},
      permissions: "none",
      root,
      domain,
      service,
      network
    });

    expect(document).to.deep.equal({
      permissions: []
    });
  });
});
