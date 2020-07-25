const { expect } = require("chai").use(require("sinon-chai"));

const { restore, fake, stub, replace } = require("sinon");

const post = require("..");
const deps = require("../deps");

const eventData = [{ event: { headers: {} } }, { event: { headers: {} } }];
const scenario = "some-scenario";

describe("Event store post", () => {
  // afterEach(() => {
  //   restore();
  // });
  // it("should call with the correct params", async () => {
  //   const postTransactionResult = "some-post-transaction-result";
  //   const postTransactionFake = fake.returns(postTransactionResult);
  //   replace(deps, "postTransaction", postTransactionFake);
  //   const req = {
  //     body: {
  //       eventData,
  //       scenario,
  //     },
  //   };
  //   const sendStatusFake = fake();
  //   const res = {
  //     sendStatus: sendStatusFake,
  //   };
  //   const saveEventsFn = "some-save-events-fn";
  //   const reserveRootCountsFn = "some-reserve-root-counts-fn";
  //   const publishFnFake = fake();
  //   const savedEventHeadersTopic = "some-saved-event-headers-topic";
  //   const savedEventCreatedTimestamp = "some-event-created-timestamp";
  //   const createTransactionFnFake = fake.returns({
  //     receipt: [
  //       {
  //         created: savedEventCreatedTimestamp,
  //         topic: savedEventHeadersTopic,
  //       },
  //       {
  //         created: savedEventCreatedTimestamp,
  //         topic: savedEventHeadersTopic,
  //       },
  //     ],
  //   });
  //   const idempotencyConflictCheckFnFake = fake();
  //   await post({
  //     saveEventsFn,
  //     reserveRootCountsFn,
  //     publishFn: publishFnFake,
  //     createTransactionFn: createTransactionFnFake,
  //     idempotencyConflictCheckFn: idempotencyConflictCheckFnFake,
  //   })(req, res);
  //   expect(idempotencyConflictCheckFnFake).to.not.have.been.called;
  //   expect(createTransactionFnFake).to.have.been.calledWith(
  //     postTransactionResult
  //   );
  //   expect(postTransactionFake).to.have.been.calledWith({
  //     eventData,
  //     scenario,
  //     saveEventsFn,
  //     reserveRootCountsFn,
  //   });
  //   expect(publishFnFake).to.have.been.calledWith(
  //     { from: savedEventCreatedTimestamp },
  //     savedEventHeadersTopic
  //   );
  //   expect(publishFnFake).to.have.been.calledOnce;
  //   expect(sendStatusFake).to.have.been.calledWith(204);
  // });
  // it("should call with the correct params with event idempotency conflict passed in", async () => {
  //   const postTransactionResult = "some-post-transaction-result";
  //   const postTransactionFake = fake.returns(postTransactionResult);
  //   replace(deps, "postTransaction", postTransactionFake);
  //   const idempotency = "some-idempotency";
  //   const req = {
  //     body: {
  //       eventData: [
  //         { event: { headers: { idempotency } } },
  //         { event: { headers: { idempotency } } },
  //       ],
  //       scenario,
  //     },
  //   };
  //   const sendStatusFake = fake();
  //   const res = {
  //     sendStatus: sendStatusFake,
  //   };
  //   const saveEventsFn = "some-save-events-fn";
  //   const reserveRootCountsFn = "some-reserve-root-counts-fn";
  //   const publishFnFake = fake();
  //   const savedEventHeadersTopic = "some-saved-event-headers-topic";
  //   const savedEventCreatedTimestamp = "some-event-created-timestamp";
  //   const createTransactionFnFake = fake.returns({
  //     receipt: [
  //       {
  //         created: savedEventCreatedTimestamp,
  //         topic: savedEventHeadersTopic,
  //       },
  //     ],
  //   });
  //   const idempotencyConflictCheckFnFake = fake.returns(false);
  //   await post({
  //     saveEventsFn,
  //     reserveRootCountsFn,
  //     publishFn: publishFnFake,
  //     createTransactionFn: createTransactionFnFake,
  //     idempotencyConflictCheckFn: idempotencyConflictCheckFnFake,
  //   })(req, res);
  //   expect(idempotencyConflictCheckFnFake.getCall(0)).to.have.been.calledWith(
  //     idempotency
  //   );
  //   expect(idempotencyConflictCheckFnFake.getCall(1)).to.have.been.calledWith(
  //     idempotency
  //   );
  //   expect(idempotencyConflictCheckFnFake).to.have.been.calledTwice;
  //   expect(createTransactionFnFake).to.have.been.calledWith(
  //     postTransactionResult
  //   );
  //   expect(postTransactionFake).to.have.been.calledWith({
  //     eventData: [{ event: { headers: { idempotency } } }],
  //     scenario,
  //     saveEventsFn,
  //     reserveRootCountsFn,
  //   });
  //   expect(publishFnFake).to.have.been.calledWith(
  //     { from: savedEventCreatedTimestamp },
  //     savedEventHeadersTopic
  //   );
  //   expect(sendStatusFake).to.have.been.calledWith(204);
  // });
  // it("should call with the correct params with event no idempotency passed in", async () => {
  //   const postTransactionResult = "some-post-transaction-result";
  //   const postTransactionFake = fake.returns(postTransactionResult);
  //   replace(deps, "postTransaction", postTransactionFake);
  //   const idempotency1 = "some-idempotency1";
  //   const idempotency2 = "some-idempotency2";
  //   const req = {
  //     body: {
  //       eventData: [
  //         { event: { headers: { idempotency: idempotency1 } } },
  //         { event: { headers: { idempotency: idempotency2 } } },
  //       ],
  //       scenario,
  //     },
  //   };
  //   const sendStatusFake = fake();
  //   const res = {
  //     sendStatus: sendStatusFake,
  //   };
  //   const saveEventsFn = "some-save-events-fn";
  //   const reserveRootCountsFn = "some-reserve-root-counts-fn";
  //   const publishFnFake = fake();
  //   const savedEventHeadersTopic = "some-saved-event-headers-topic";
  //   const savedEventCreatedTimestamp = "some-event-created-timestamp";
  //   const createTransactionFnFake = fake.returns({
  //     receipt: [
  //       {
  //         created: savedEventCreatedTimestamp,
  //         topic: savedEventHeadersTopic,
  //       },
  //     ],
  //   });
  //   const idempotencyConflictCheckFnFake = fake.returns(false);
  //   await post({
  //     saveEventsFn,
  //     reserveRootCountsFn,
  //     publishFn: publishFnFake,
  //     createTransactionFn: createTransactionFnFake,
  //     idempotencyConflictCheckFn: idempotencyConflictCheckFnFake,
  //   })(req, res);
  //   expect(idempotencyConflictCheckFnFake.getCall(0)).to.have.been.calledWith(
  //     idempotency1
  //   );
  //   expect(idempotencyConflictCheckFnFake.getCall(1)).to.have.been.calledWith(
  //     idempotency2
  //   );
  //   expect(idempotencyConflictCheckFnFake).to.have.been.calledTwice;
  //   expect(createTransactionFnFake).to.have.been.calledWith(
  //     postTransactionResult
  //   );
  //   expect(postTransactionFake).to.have.been.calledWith({
  //     eventData: [
  //       { event: { headers: { idempotency: idempotency1 } } },
  //       { event: { headers: { idempotency: idempotency2 } } },
  //     ],
  //     scenario,
  //     saveEventsFn,
  //     reserveRootCountsFn,
  //   });
  //   expect(publishFnFake).to.have.been.calledWith(
  //     { from: savedEventCreatedTimestamp },
  //     savedEventHeadersTopic
  //   );
  //   expect(sendStatusFake).to.have.been.calledWith(204);
  // });
  // it("should call with the correct params with idempotency fn conflict", async () => {
  //   const postTransactionResult = "some-post-transaction-result";
  //   const postTransactionFake = fake.returns(postTransactionResult);
  //   replace(deps, "postTransaction", postTransactionFake);
  //   const idempotency1 = "some-idempotency1";
  //   const idempotency2 = "some-idempotency2";
  //   const req = {
  //     body: {
  //       eventData: [
  //         { event: { headers: { idempotency: idempotency1 } } },
  //         { event: { headers: { idempotency: idempotency2 } } },
  //       ],
  //       scenario,
  //     },
  //   };
  //   const sendStatusFake = fake();
  //   const res = {
  //     sendStatus: sendStatusFake,
  //   };
  //   const saveEventsFn = "some-save-events-fn";
  //   const reserveRootCountsFn = "some-reserve-root-counts-fn";
  //   const publishFnFake = fake();
  //   const savedEventHeadersTopic = "some-saved-event-headers-topic";
  //   const savedEventCreatedTimestamp = "some-event-created-timestamp";
  //   const createTransactionFnFake = fake.returns({
  //     receipt: [
  //       {
  //         created: savedEventCreatedTimestamp,
  //         topic: savedEventHeadersTopic,
  //       },
  //     ],
  //   });
  //   const idempotencyConflictCheckFnFake = stub()
  //     .onFirstCall()
  //     .returns(false)
  //     .onSecondCall()
  //     .returns(true);
  //   await post({
  //     saveEventsFn,
  //     reserveRootCountsFn,
  //     publishFn: publishFnFake,
  //     createTransactionFn: createTransactionFnFake,
  //     idempotencyConflictCheckFn: idempotencyConflictCheckFnFake,
  //   })(req, res);
  //   expect(idempotencyConflictCheckFnFake.getCall(0)).to.have.been.calledWith(
  //     idempotency1
  //   );
  //   expect(idempotencyConflictCheckFnFake.getCall(1)).to.have.been.calledWith(
  //     idempotency2
  //   );
  //   expect(idempotencyConflictCheckFnFake).to.have.been.calledTwice;
  //   expect(createTransactionFnFake).to.have.been.calledWith(
  //     postTransactionResult
  //   );
  //   expect(postTransactionFake).to.have.been.calledWith({
  //     eventData: [{ event: { headers: { idempotency: idempotency1 } } }],
  //     scenario,
  //     saveEventsFn,
  //     reserveRootCountsFn,
  //   });
  //   expect(publishFnFake).to.have.been.calledWith(
  //     { from: savedEventCreatedTimestamp },
  //     savedEventHeadersTopic
  //   );
  //   expect(sendStatusFake).to.have.been.calledWith(204);
  // });
});
