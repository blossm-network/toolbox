const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake } = require("sinon");

const deps = require("../deps");

const authorize = require("..");

const secret = "some-secret";
process.env.SECRET = secret;

const service = "some-service";
const network = "some-network";
const domain = "some-domain";
const root = "some-root";
const priviledges = ["some-priviledges"];
const joinedPriviledges = priviledges.join(",");

const principle = "some-priciple-root";

const context = {
  network,
  service,
  any: "any-root"
};

describe("Authorize command", () => {
  beforeEach(() => {
    process.env.SERVICE = service;
    process.env.NETWORK = network;
    process.env.DOMAIN = domain;
  });
  afterEach(() => {
    restore();
  });
  it("should authorize all wildcards", async () => {
    const scopes = ["*:*:*"];

    replace(deps, "validate", fake.returns({ scopes, context, principle }));

    const bearer = "bearer-some";
    const document = await authorize({
      priviledges,
      root,
      tokens: {
        bearer
      }
    });

    expect(deps.validate).to.have.been.calledWith({
      token: bearer,
      secret
    });
    expect(document).to.deep.equal({
      context: {
        ...context,
        scopes,
        principle
      }
    });
  });
  it("should authorize with matching scope", async () => {
    const scopes = [`${domain}:${root}:${joinedPriviledges}`];

    replace(deps, "validate", fake.returns({ scopes, context, principle }));

    const bearer = "bearer-some";
    const document = await authorize({
      priviledges,
      root,
      tokens: {
        bearer
      }
    });

    expect(document).to.deep.equal({
      context: {
        ...context,
        scopes,
        principle
      }
    });
  });
  it("should authorize with multiple matching scopes", async () => {
    const scopes = [
      `${domain}:${root}:${joinedPriviledges}`,
      `*:${root}:${joinedPriviledges}`,
      `${domain}:${root}:*`,
      `${domain}:*:${joinedPriviledges}`,
      `${domain}:${root},some-other:*`,
      `${domain}:*:${joinedPriviledges},some-other,${joinedPriviledges}`,
      `${domain},some-other:*:${joinedPriviledges}`
    ];

    replace(deps, "validate", fake.returns({ scopes, context, principle }));

    const bearer = "bearer-some";
    const document = await authorize({
      priviledges,
      root,
      tokens: {
        bearer
      }
    });

    expect(document).to.deep.equal({
      context: {
        ...context,
        scopes,
        principle
      }
    });
  });
  it("should authorize without priviledges", async () => {
    const scopes = ["*:bogus:*"];

    replace(deps, "validate", fake.returns({ scopes, context, principle }));

    const bearer = "bearer-some";
    const document = await authorize({
      tokens: {
        bearer
      }
    });

    expect(deps.validate).to.have.been.calledWith({
      token: bearer,
      secret
    });
    expect(document).to.deep.equal({
      context: {
        ...context,
        scopes,
        principle
      }
    });
  });
  it("should authorize all wildcards with no token and not strict", async () => {
    const scopes = [];

    replace(deps, "validate", fake.returns({ scopes, context, principle }));

    const document = await authorize({
      priviledges,
      root,
      tokens: {},
      strict: false
    });

    expect(document).to.deep.equal({});
  });
  it("should not authorize if theres a mismatch in priviledges", async () => {
    const scopes = [`${domain}:${root}:bogus`];

    replace(deps, "validate", fake.returns({ scopes, context, principle }));

    const bearer = "bearer-some";
    expect(
      async () =>
        await authorize({
          priviledges,
          root,
          tokens: {
            bearer
          }
        })
    ).to.throw;
  });
  it("should not authorize if theres a mismatch in root", async () => {
    const scopes = [`${domain}:bogus:${joinedPriviledges}`];

    replace(deps, "validate", fake.returns({ scopes, context, principle }));

    const bearer = "bearer-some";
    expect(
      async () =>
        await authorize({
          priviledges,
          root,
          tokens: {
            bearer
          }
        })
    ).to.throw;
  });
  it("should not authorize if theres a mismatch in domain", async () => {
    const scopes = [`bogus:${root}:${joinedPriviledges}`];

    replace(deps, "validate", fake.returns({ scopes, context, principle }));

    const bearer = "bearer-some";

    expect(
      async () =>
        await authorize({
          priviledges,
          root,
          tokens: {
            bearer
          }
        })
    ).to.throw;
  });
  it("should not authorize if theres a mismatch in service", async () => {
    const scopes = [`${domain}:${root}:${joinedPriviledges}`];

    replace(deps, "validate", fake.returns({ scopes, context, principle }));

    const bearer = "bearer-some";

    process.env.SERVICE = "bogus";

    expect(
      async () =>
        await authorize({
          priviledges,
          root,
          tokens: {
            bearer
          }
        })
    ).to.throw;
  });
  it("should not authorize if theres a mismatch in network", async () => {
    const scopes = [`${domain}:${root}:${joinedPriviledges}`];

    replace(deps, "validate", fake.returns({ scopes, context, principle }));

    const bearer = "bearer-some";

    process.env.NETWORK = "bogus";

    expect(
      async () =>
        await authorize({
          priviledges,
          root,
          tokens: {
            bearer
          }
        })
    ).to.throw;
  });
  it("should not authorize if there are no token", async () => {
    const scopes = [`${domain}:${root}:${joinedPriviledges}`];

    replace(deps, "validate", fake.returns({ scopes, context, principle }));

    expect(
      async () =>
        await authorize({
          priviledges,
          root,
          tokens: {}
        })
    ).to.throw;
  });
  it("should not authorize if there are no token", async () => {
    const scopes = [`${domain}:${root}:${joinedPriviledges}`];

    replace(deps, "validate", fake.returns({ scopes, context, principle }));

    expect(
      async () =>
        await authorize({
          priviledges,
          root,
          tokens: {}
        })
    ).to.throw;
  });
});
