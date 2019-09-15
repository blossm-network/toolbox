const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");
const deps = require("../deps");
const corsMiddleware = require("..");

const corsResult = "some-result";
const whitelist = ["some-origin"];
const check = "some-check";
describe("Cors middleware", () => {
  afterEach(() => {
    restore();
  });
  it("should call correctly", async () => {
    const corsFake = fake.returns(corsResult);

    replace(deps, "cors", corsFake);

    const whitelistFake = fake.returns({ check });
    replace(deps, "whitelist", whitelistFake);

    const useFake = fake();
    const optionsFake = fake();
    const app = {
      use: useFake,
      options: optionsFake
    };
    await corsMiddleware({ app, whitelist });

    expect(corsFake).to.have.been.calledWith({
      origin: check,
      methods: "GET,POST",
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: false
    });
    expect(useFake).to.have.been.calledWith(corsResult);
    expect(whitelistFake).to.have.been.calledWith(whitelist);
    expect(optionsFake).to.have.been.calledWith("*", corsResult);
  });
  it("should call correctly if credentials is true", async () => {
    const corsFake = fake.returns(corsResult);

    replace(deps, "cors", corsFake);

    const whitelistFake = fake.returns({ check });
    replace(deps, "whitelist", whitelistFake);

    const useFake = fake();
    const optionsFake = fake();
    const app = {
      use: useFake,
      options: optionsFake
    };
    await corsMiddleware({ app, whitelist, credentials: true });

    expect(corsFake).to.have.been.calledWith({
      origin: check,
      methods: "GET,POST",
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true
    });
    expect(useFake).to.have.been.calledWith(corsResult);
    expect(whitelistFake).to.have.been.calledWith(whitelist);
    expect(optionsFake).to.have.been.calledWith("*", corsResult);
  });
});
