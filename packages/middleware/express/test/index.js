const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, createSandbox } = require("sinon");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const middleware = require("..");

const sandbox = createSandbox();

describe("Middleware", () => {
  afterEach(() => {
    restore();
    sandbox.restore();
  });
  it("should call correctly", async () => {
    const bodyParserUseableJson = "some-useable";
    sandbox.replaceGetter(bodyParser, "json", () => () =>
      bodyParserUseableJson
    );
    const useFake = fake();
    const app = {
      use: useFake
    };
    await middleware(app);
    expect(useFake).to.have.been.calledWith(bodyParserUseableJson);
    expect(useFake).to.have.been.calledWith(cookieParser);
  });
});
