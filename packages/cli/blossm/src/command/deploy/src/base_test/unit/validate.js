import * as chai from "chai";
import sinonChai from "sinon-chai";

import validate from "../../validate.js";
import config from "../../config.json" with { type: "json" };

chai.use(sinonChai);
const { expect } = chai;

// describe("Command handler store validator tests", () => {
//   it("should handle correct payload correctly", async () => {
//     if (!config.testing.validate || !config.testing.validate.ok) return;
//     try {
//       for (const payload of config.testing.validate.ok)
//         await validate(payload, {
//           ...(config.testing.validate.context && {
//             context: config.testing.validate.context,
//           }),
//         });
//     } catch (e) {
//       //shouldn't get called.
//       expect(1).to.equal(0);
//     }
//   });

//   it("should throw if invalid param is passed", async () => {
//     if (!config.testing.validate || !config.testing.validate.bad) return;
//     for (const value of config.testing.validate.bad) {
//       try {
//         await validate(
//           createBadPayload({
//             bad: value,
//             ok: config.testing.validate.ok[0] || {},
//           }),
//           {
//             ...(config.testing.validate.context && {
//               context: config.testing.validate.context,
//             }),
//           }
//         );

//         //shouldn't get called.
//         expect(0).to.equal(1);
//       } catch (e) {
//         if (!e.statusCode) {
//           //eslint-disable-next-line no-console
//           console.log(e);
//         }
//         expect(e.statusCode).to.equal(409);
//       }
//     }
//   });
// });

// const createBadPayload = ({ bad, ok }) => {
//   let payload = { ...bad };

//   for (const property in ok) {
//     if (bad[property] == undefined) payload[property] = ok[property];
//     else if (
//       typeof ok[property] == "object" &&
//       !(ok[property] instanceof Array) &&
//       typeof bad[property] == "object" &&
//       !(bad[property] instanceof Array)
//     )
//       payload[property] = createBadPayload({
//         bad: bad[property],
//         ok: ok[property],
//       });
//     else if (ok[property] instanceof Array && bad[property] instanceof Array)
//       payload[property] = [
//         createBadPayload({
//           bad: bad[property][0],
//           ok: ok[property][0],
//         }),
//       ];
//     else {
//       payload[property] = bad[property];
//     }
//   }

//   return payload;
// };
