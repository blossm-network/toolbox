const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect } = chai;
const { restore, fake, replace } = require("sinon");
const deps = require("../deps");
const middleware = require("..");

describe("Middleware", () => {
  afterEach(() => {
    restore();
  });
  it("should call correctly", async () => {
    const bodyParserUseableJson = "some-useable";
    const cookieParserUseableJson = "another-other-usable";

    const jsonBodyParserFake = fake.returns(bodyParserUseableJson);
    const cookieParserFake = fake.returns(cookieParserUseableJson);
    replace(deps, "jsonBodyParser", jsonBodyParserFake);
    replace(deps, "cookieParser", cookieParserFake);
    const useFake = fake();
    const app = {
      use: useFake,
    };
    await middleware(app);
    expect(useFake).to.have.been.calledWith(bodyParserUseableJson);
    expect(useFake).to.have.been.calledWith(cookieParserUseableJson);
  });
});
