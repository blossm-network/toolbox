// const { expect } = require("chai").use(require("sinon-chai"));
// const { restore, replace, fake } = require("sinon");

// const deps = require("../deps");
// const post = require("..");

// const responseBody = "some-response-body";
// const response = { body: responseBody };
// const body = "some-body";
// const context = "some-context";
// const name = "some-name";
// const domain = "some-domain";
// const service = "some-service";
// const network = "some-network";
// const payload = "some-payload";
// const headers = "some-headers";

process.env.NODE_ENV = "some-nonlocal-env";

describe("Command relay post", () => {
  // afterEach(() => {
  //   restore();
  // });
  // it("should call with the correct params", async () => {
  //   const postFake = fake.returns(response);
  //   replace(deps, "post", postFake);
  //   const req = {
  //     context,
  //     body: {
  //       name,
  //       domain,
  //       service,
  //       network,
  //       payload,
  //       headers
  //     }
  //   };
  //   const sendFake = fake();
  //   const statusFake = fake.returns({
  //     send: sendFake
  //   });
  //   const cookieFake = fake();
  //   const res = {
  //     cookie: cookieFake,
  //     status: statusFake
  //   };
  //   await post(req, res);
  //   expect(postFake).to.have.been.calledWith(
  //     "https://command.some-domain.some-service.some-network/some-name",
  //     {
  //       body: {
  //         payload,
  //         headers,
  //         context
  //       }
  //     }
  //   );
  //   expect(statusFake).to.have.been.calledWith(200);
  //   expect(sendFake).to.have.been.calledWith(responseBody);
  // });
  // // it("should call with the correct params if response is empty", async () => {
  // //   const validateFake = fake();
  // //   replace(deps, "validate", validateFake);
  // //   const normalizeFake = fake.returns({ payload, headers, root });
  // //   replace(deps, "normalize", normalizeFake);
  // //   const issueFake = fake.returns();
  // //   const setFake = fake.returns({
  // //     issue: issueFake
  // //   });
  // //   const commandFake = fake.returns({
  // //     set: setFake
  // //   });
  // //   replace(deps, "command", commandFake);
  // //   const req = {
  // //     context,
  // //     claims,
  // //     body,
  // //     params: {}
  // //   };
  // //   const sendFake = fake();
  // //   const statusFake = fake.returns({
  // //     send: sendFake
  // //   });
  // //   const cookieFake = fake();
  // //   const res = {
  // //     status: statusFake,
  // //     cookie: cookieFake
  // //   };
  // //   await post({ name, domain })(req, res);
  // //   expect(validateFake).to.have.been.calledWith(body);
  // //   expect(normalizeFake).to.have.been.calledWith(body);
  // //   expect(commandFake).to.have.been.calledWith({
  // //     name,
  // //     domain
  // //   });
  // //   expect(setFake).to.have.been.calledWith({
  // //     tokenFn: deps.gcpToken,
  // //     context,
  // //     claims
  // //   });
  // //   expect(issueFake).to.have.been.calledWith(payload, { ...headers, root });
  // //   expect(statusFake).to.have.been.calledWith(204);
  // //   expect(sendFake).to.have.been.calledWith();
  // // });
  // // it("should call with the correct params if tokens is in the response", async () => {
  // //   const validateFake = fake();
  // //   replace(deps, "validate", validateFake);
  // //   const normalizeFake = fake.returns({ payload, headers, root });
  // //   replace(deps, "normalize", normalizeFake);
  // //   const token1Network = "some-token1-network";
  // //   const token1Type = "some-token1-type";
  // //   const token1Value = "some-token1-value";
  // //   const token2Network = "some-token2-network";
  // //   const token2Type = "some-token2-type";
  // //   const token2Value = "some-token2-value";
  // //   const token1 = {
  // //     network: token1Network,
  // //     type: token1Type,
  // //     value: token1Value
  // //   };
  // //   const token2 = {
  // //     network: token2Network,
  // //     type: token2Type,
  // //     value: token2Value
  // //   };
  // //   const issueFake = fake.returns({ tokens: [token1, token2] });
  // //   const setFake = fake.returns({
  // //     issue: issueFake
  // //   });
  // //   const commandFake = fake.returns({
  // //     set: setFake
  // //   });
  // //   replace(deps, "command", commandFake);
  // //   const req = {
  // //     context,
  // //     claims,
  // //     body,
  // //     params: {}
  // //   };
  // //   const sendFake = fake();
  // //   const statusFake = fake.returns({
  // //     send: sendFake
  // //   });
  // //   const cookieFake = fake();
  // //   const res = {
  // //     cookie: cookieFake,
  // //     status: statusFake
  // //   };
  // //   await post({ name, domain })(req, res);
  // //   expect(cookieFake).to.have.been.calledTwice;
  // //   expect(cookieFake).to.have.been.calledWith(
  // //     `${token1Network}-${token1Type}`,
  // //     token1Value,
  // //     {
  // //       httpOnly: true,
  // //       secure: true
  // //     }
  // //   );
  // //   expect(cookieFake).to.have.been.calledWith(
  // //     `${token2Network}-${token2Type}`,
  // //     token2Value,
  // //     {
  // //       httpOnly: true,
  // //       secure: true
  // //     }
  // //   );
  // //   expect(validateFake).to.have.been.calledWith(body);
  // //   expect(normalizeFake).to.have.been.calledWith(body);
  // //   expect(commandFake).to.have.been.calledWith({
  // //     name,
  // //     domain
  // //   });
  // //   expect(setFake).to.have.been.calledWith({
  // //     tokenFn: deps.gcpToken,
  // //     context,
  // //     claims
  // //   });
  // //   expect(issueFake).to.have.been.calledWith(payload, { ...headers, root });
  // //   expect(statusFake).to.have.been.calledWith(200);
  // // });
  // it("should throw correctly", async () => {
  //   const errorMessage = "error-message";
  //   const postFake = fake.rejects(new Error(errorMessage));
  //   replace(deps, "post", postFake);
  //   const req = {
  //     context,
  //     body
  //   };
  //   try {
  //     await post(req);
  //     //shouldn't get called
  //     expect(2).to.equal(1);
  //   } catch (e) {
  //     expect(e.message).to.equal(errorMessage);
  //   }
  // });
});
