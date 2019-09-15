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
    replace(deps, "cors", corsFake);

    const useFake = fake();
    const optionsFake = fake();
    const app = {
      use: useFake,
      options: optionsFake
    };
    await corsMiddleware(app);

    expect(corsFake).to.have.been.calledWith({
      origin: "*",
      methods: "GET,POST",
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true
    });
    expect(useFake).to.have.been.calledWith(corsResult);
    expect(optionsFake).to.have.been.calledWith("*", corsResult);
  });
});
