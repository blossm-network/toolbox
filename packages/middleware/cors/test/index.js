const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");
const deps = require("../deps");
const corsMiddleware = require("..");

describe("Cors middleware", () => {
  afterEach(() => {
    restore();
  });
  it("should call correctly", async () => {
    const corsResult = "some-result";
    const corsFake = fake.returns(corsResult);
    const whitelist = ["some-origin"];

    replace(deps, "cors", corsFake);

    const check = "some-check";

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
      credentials: true
    });
    expect(useFake).to.have.been.calledWith(corsResult);
    expect(whitelistFake).to.have.been.calledWith(whitelist);
    expect(optionsFake).to.have.been.calledWith("*", corsResult);
  });
});
