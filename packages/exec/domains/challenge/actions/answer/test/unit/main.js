// const { expect } = require("chai")
//   .use(require("chai-datetime"))
//   .use(require("sinon-chai"));
// const { restore, replace, fake, useFakeTimers, stub } = require("sinon");

// const main = require("../../main");
// const deps = require("../../deps");

// let clock;
// const now = new Date();
// const root = "some-root";
// const principle = "some-account-principle";
// const phone = "some-account-phone";
// const personAccount = {
//   principle,
//   phone
// };
// const payloadPhone = "some-payload-phone";
// const payload = {
//   phone: payloadPhone
// };
// const context = "some-context";
// const service = "some-service";
// const network = "some-network";
// const token = "some-token";
// const code = "some-code";

// process.env.SERVICE = service;
// process.env.NETWORK = network;

// describe("Command handler unit tests", () => {
//   beforeEach(() => {
//     clock = useFakeTimers(now.getTime());
//   });
//   afterEach(() => {
//     clock.restore();
//     restore();
//   });
//   it("should return successfully", async () => {
//     const uuidFake = fake.returns(root);
//     replace(deps, "uuid", uuidFake);

//     const readFake = fake.returns([personAccount]);
//     const updateFake = fake();
//     const setFake = stub()
//       .onFirstCall()
//       .returns({
//         read: readFake
//       })
//       .onSecondCall()
//       .returns({
//         update: updateFake
//       });
//     const viewStoreFake = fake.returns({
//       set: setFake
//     });
//     replace(deps, "viewStore", viewStoreFake);

//     const createJwtFake = fake.returns(token);
//     replace(deps, "createJwt", createJwtFake);

//     const randomIntFake = fake.returns(code);
//     replace(deps, "randomIntOfLength", randomIntFake);

//     const result = await main({ payload, context });

//     expect(result).to.deep.equal(root);
//     expect(readFake).to.have.been.calledWith({ phone: payloadPhone });
//     expect(setFake).to.have.been.calledWith({
//       context,
//       tokenFn: deps.gcpToken
//     });
//     expect(viewStoreFake).to.have.been.calledWith({
//       name: "phones",
//       domain: "person-account",
//       service,
//       network
//     });
//     expect(viewStoreFake).to.have.been.calledWith({
//       name: "codes",
//       domain: "challenge",
//       service,
//       network
//     });
//     expect(createJwtFake).to.have.been.calledWith({
//       options: {
//         issuer: `issue.challenge.${service}.${network}`,
//         subject: principle,
//         audience: `auth.${service}.${network}/challenge/answer`,
//         expiresIn: 180
//       },
//       payload: {
//         root
//       },
//       signFn: deps.sign
//     });
//     expect(randomIntFake).to.have.been.calledWith(6);
//   });
// });
