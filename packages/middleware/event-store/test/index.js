const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake, createSandbox } = require("sinon");
const bodyParser = require("body-parser");
const middleware = require("..");

const sandbox = createSandbox();

describe("Command middleware", () => {
  afterEach(() => {
    restore();
    sandbox.restore();
  });
  it("should call correctly", async () => {
    const useableJson = "some-useable";
    sandbox.replaceGetter(bodyParser, "json", () => () => useableJson);
    const useFake = fake();
    const app = {
      use: useFake
    };
    await middleware(app);
    expect(useFake).to.have.been.calledWith(useableJson);
  });
});
