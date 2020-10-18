const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");
const deps = require("../deps");
const corsMiddleware = require("..");

const corsResult = "some-result";
const allow = ["some-origin"];
const check = "some-check";
const method0 = "some-method";
const method1 = "some-other-method";
const methods = [method0, method1];

const network = "some-network";
process.env.NETWORK = network;

describe("Cors middleware", () => {
  afterEach(() => {
    restore();
  });
  it("should call correctly", async () => {
    const corsFake = fake.returns(corsResult);

    replace(deps, "cors", corsFake);

    const allowFake = fake.returns({ check });
    replace(deps, "allow", allowFake);

    const useFake = fake();
    const optionsFake = fake();
    const app = {
      use: useFake,
      options: optionsFake,
    };
    await corsMiddleware({ app, allow, methods });

    expect(corsFake).to.have.been.calledWith({
      origin: check,
      methods: `${method0},${method1}`,
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: false,
    });
    expect(useFake).to.have.been.calledWith(corsResult);
    expect(allowFake).to.have.been.calledWith([`https://${network}`, ...allow]);
    expect(optionsFake).to.have.been.calledWith("*", corsResult);
  });
  it("should call correctly if credentials is true", async () => {
    const corsFake = fake.returns(corsResult);

    replace(deps, "cors", corsFake);

    const allowFake = fake.returns({ check });
    replace(deps, "allow", allowFake);

    const useFake = fake();
    const optionsFake = fake();
    const app = {
      use: useFake,
      options: optionsFake,
    };
    await corsMiddleware({ app, allow, credentials: true, methods });

    expect(corsFake).to.have.been.calledWith({
      origin: check,
      methods: `${method0},${method1}`,
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true,
    });
    expect(useFake).to.have.been.calledWith(corsResult);
    expect(allowFake).to.have.been.calledWith([`https://${network}`, ...allow]);
    expect(optionsFake).to.have.been.calledWith("*", corsResult);
  });
});
