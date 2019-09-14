const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, replace } = require("sinon");
const deps = require("../deps");
const middleware = require("..");

describe("Middleware", () => {
  afterEach(() => {
    restore();
  });
  it("should call correctly", async () => {
    const bodyParserUseableJson = "some-useable";
    const cookieParserUseableJson = "some-other-usable";

    const jsonBodyParserFake = fake.returns(bodyParserUseableJson);
    const cookieParserFake = fake.returns(cookieParserUseableJson);
    replace(deps, "jsonBodyParser", jsonBodyParserFake);
    replace(deps, "cookieParser", cookieParserFake);
    const useFake = fake();
    const app = {
      use: useFake
    };
    await middleware(app);
    expect(useFake).to.have.been.calledWith(bodyParserUseableJson);
    expect(useFake).to.have.been.calledWith(cookieParserUseableJson);
  });
});
