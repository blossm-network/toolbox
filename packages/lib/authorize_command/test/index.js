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
const priviledge = "some-priviledge";

const principle = "some-priciple-root";

const context = {
  network,
  service,
  any: "any-root"
};

describe("Authorize command", () => {
  afterEach(() => {
    restore();
  });
  it("should authorize all wildcards", async () => {
    const scopes = ["*:*:*"];

    replace(deps, "validate", fake.returns({ scopes, context, principle }));

    const bearer = "bearer-some";
    const document = await authorize({
      requirements: {
        network,
        service,
        domain: "domain",
        priviledge: "priviledge",
        root: "root"
      },
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
    const scopes = [`${domain}:${root}:${priviledge}`];

    replace(deps, "validate", fake.returns({ scopes, context, principle }));

    const bearer = "bearer-some";
    const document = await authorize({
      requirements: {
        network,
        service,
        domain,
        priviledge,
        root
      },
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
      `${domain}:${root}:${priviledge}`,
      `*:${root}:${priviledge}`,
      `${domain}:${root}:*`,
      `${domain}:*:${priviledge}`,
      `${domain}:${root},some-other:*`,
      `${domain}:*:${priviledge},some-other,${priviledge}`,
      `${domain},some-other:*:${priviledge}`
    ];

    replace(deps, "validate", fake.returns({ scopes, context, principle }));

    const bearer = "bearer-some";
    const document = await authorize({
      requirements: {
        network,
        service,
        domain,
        priviledge,
        root
      },
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
  it("should authorize without requirements", async () => {
    const scopes = ["*:bogus:*"];

    replace(deps, "validate", fake.returns({ scopes, context, principle }));

    const bearer = "bearer-some";
    const document = await authorize({
      requirements: {},
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
      requirements: {
        network,
        service,
        domain: "domain",
        priviledge: "priviledge",
        root: "root"
      },
      tokens: {},
      strict: false
    });

    expect(document).to.deep.equal({});
  });
  it("should not authorize if theres a mismatch in priviledge", async () => {
    const scopes = [`${domain}:${root}:bogus`];

    replace(deps, "validate", fake.returns({ scopes, context, principle }));

    const bearer = "bearer-some";
    expect(
      async () =>
        await authorize({
          requirements: {
            network,
            service,
            domain,
            priviledge,
            root
          },
          tokens: {
            bearer
          }
        })
    ).to.throw;
  });
  it("should not authorize if theres a mismatch in root", async () => {
    const scopes = [`${domain}:bogus:${priviledge}`];

    replace(deps, "validate", fake.returns({ scopes, context, principle }));

    const bearer = "bearer-some";
    expect(
      async () =>
        await authorize({
          requirements: {
            network,
            service,
            domain,
            priviledge,
            root
          },
          tokens: {
            bearer
          }
        })
    ).to.throw;
  });
  it("should not authorize if theres a mismatch in domain", async () => {
    const scopes = [`bogus:${root}:${priviledge}`];

    replace(deps, "validate", fake.returns({ scopes, context, principle }));

    const bearer = "bearer-some";
    expect(
      async () =>
        await authorize({
          requirements: {
            network,
            service,
            domain,
            priviledge,
            root
          },
          tokens: {
            bearer
          }
        })
    ).to.throw;
  });
  it("should not authorize if theres a mismatch in service", async () => {
    const scopes = [`${domain}:${root}:${priviledge}`];

    replace(deps, "validate", fake.returns({ scopes, context, principle }));

    const bearer = "bearer-some";
    expect(
      async () =>
        await authorize({
          requirements: {
            network,
            service: "bogus",
            domain,
            priviledge,
            root
          },
          tokens: {
            bearer
          }
        })
    ).to.throw;
  });
  it("should not authorize if theres a mismatch in network", async () => {
    const scopes = [`${domain}:${root}:${priviledge}`];

    replace(deps, "validate", fake.returns({ scopes, context, principle }));

    const bearer = "bearer-some";
    expect(
      async () =>
        await authorize({
          requirements: {
            network: "bogus",
            service,
            domain,
            priviledge,
            root
          },
          tokens: {
            bearer
          }
        })
    ).to.throw;
  });
  it("should not authorize if there are no token", async () => {
    const scopes = [`${domain}:${root}:${priviledge}`];

    replace(deps, "validate", fake.returns({ scopes, context, principle }));

    expect(
      async () =>
        await authorize({
          requirements: {
            network,
            service,
            domain,
            priviledge,
            root
          },
          tokens: {}
        })
    ).to.throw;
  });
  it("should not authorize if there are no token", async () => {
    const scopes = [`${domain}:${root}:${priviledge}`];

    replace(deps, "validate", fake.returns({ scopes, context, principle }));

    expect(
      async () =>
        await authorize({
          requirements: {
            network,
            service,
            domain,
            priviledge,
            root
          },
          tokens: {}
        })
    ).to.throw;
  });
});
