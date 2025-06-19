
import * as chai from "chai";
import sinonChai from "sinon-chai";
import { fake, stub, replace, restore, match } from "sinon";

import deps from "../deps.js";
import { writeObject, readObject, setExpiry, __client } from "../index.js";

chai.use(sinonChai);

const { expect } = chai;

const value = { some: "value" };
const hmsetFake = stub().yields(null);
const hgetallFake = stub().yields(null, value);
const onFake = fake();
const expireFake = stub().yields(null);
const createClientFake = fake.returns();

// describe("Cache", () => {
//   afterEach(() => {
//     restore();
//   });
//   it("It should read and write correctly;", async () => {
//     replace(__client, "hmset", hmsetFake);
//     replace(__client, "hgetall", hgetallFake);
//     replace(__client, "expire", expireFake);
//     replace(__client, "on", onFake);

//     const key = "some-key";
//     await writeObject(key, value);

//     expect(hmsetFake).to.have.been.calledWith(
//       key,
//       value,
//       match(() => true)
//     );

//     const result = await readObject(key);
//     expect(result).to.equal(value);
//     expect(hgetallFake).to.have.been.calledWith(key);

//     const seconds = 2;
//     await setExpiry(key, { seconds });
//     expect(expireFake).to.have.been.calledWith(key, seconds);
//     expect(1).to.equal(1);
//   });
// });
