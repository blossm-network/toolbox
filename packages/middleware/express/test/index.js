import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, fake, replace } from "sinon";

import deps from "../deps.js";
import middleware from "../index.js";

chai.use(sinonChai);

const { expect } = chai;

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
