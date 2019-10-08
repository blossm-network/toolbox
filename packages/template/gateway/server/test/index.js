// const { expect } = require("chai").use(require("sinon-chai"));
// const { restore, replace, fake } = require("sinon");
// const authentication = require("@sustainers/authentication-middleware");
// const authorization = require("@sustainers/authorization-middleware");

// const deps = require("../deps");
// const gateway = require("..");

describe("Gateway", () => {
  // afterEach(() => {
  //   restore();
  // });
  // it("should call with the correct params", async () => {
  //   const listenFake = fake();
  //   const getFake = fake.returns({
  //     listen: listenFake
  //   });
  //   const secondPostFake = fake.returns({
  //     get: getFake
  //   });
  //   const postFake = fake.returns({
  //     post: secondPostFake
  //   });
  //   const serverFake = fake.returns({
  //     post: postFake
  //   });
  //   replace(deps, "server", serverFake);
  //   const gatewayCommandResult = "some-command-result";
  //   const gatewayPostFake = fake.returns(gatewayCommandResult);
  //   replace(deps, "command", gatewayPostFake);
  //   const gatewayViewStoreResult = "some-view-store-result";
  //   const gatewayViewStoreFake = fake.returns(gatewayViewStoreResult);
  //   replace(deps, "viewStore", gatewayViewStoreFake);
  //   const gatewayAuthResult = "some-auth-result";
  //   const gatewayAuthFake = fake.returns(gatewayAuthResult);
  //   replace(deps, "auth", gatewayAuthFake);
  //   await gateway();
  //   expect(listenFake).to.have.been.calledOnce;
  //   expect(serverFake).to.have.been.calledOnce;
  //   expect(secondPostFake).to.have.been.calledWith(gatewayCommandResult, {
  //     path: "/command/:domain/:action",
  //     preMiddleware: [authentication, authorization]
  //   });
  //   expect(getFake).to.have.been.calledWith(gatewayViewStoreResult, {
  //     path: "/view/:domain/:name",
  //     preMiddleware: [authentication, authorization]
  //   });
  //   expect(postFake).to.have.been.calledWith(gatewayAuthResult, {
  //     path: "/auth"
  //   });
  // });
  // it("should throw correctly", async () => {
  //   const errorMessage = "error-message";
  //   const listenFake = fake.throws(new Error(errorMessage));
  //   const getFake = fake.returns({
  //     listen: listenFake
  //   });
  //   const secondPostFake = fake.returns({
  //     get: getFake
  //   });
  //   const postFake = fake.returns({
  //     post: secondPostFake
  //   });
  //   const serverFake = fake.returns({
  //     post: postFake
  //   });
  //   replace(deps, "server", serverFake);
  //   const gatewayCommandResult = "some-command-result";
  //   const gatewayPostFake = fake.returns(gatewayCommandResult);
  //   replace(deps, "command", gatewayPostFake);
  //   const gatewayViewStoreResult = "some-view-store-result";
  //   const gatewayViewStoreFake = fake.returns(gatewayViewStoreResult);
  //   replace(deps, "viewStore", gatewayViewStoreFake);
  //   const gatewayAuthResult = "some-auth-result";
  //   const gatewayAuthFake = fake.returns(gatewayAuthResult);
  //   replace(deps, "auth", gatewayAuthFake);
  //   try {
  //     await gateway();
  //     //shouldn't be called
  //     expect(2).to.equal(1);
  //   } catch (e) {
  //     expect(e.message).to.equal(errorMessage);
  //   }
  // });
});
