const { expect } = require("chai");
const { string: stringDate } = require("@sustainers/datetime");

const request = require("@sustainers/request");

const url = `http://${process.env.MAIN_CONTAINER_NAME}`;

describe("Gateway integration tests", () => {
  it("should issue a command successfully", async () => {
    const payload = {
      a: 1
    };
    const domain = "some-domain";
    const action = "some-action";
    const response0 = await request.post(`${url}/auth`, {
      body: {
        payload,
        headers: {
          issued: stringDate()
        }
      }
    });

    //eslint-disable-next-line no-console
    console.log("response: ", response0);
    const cookies = response0.headers["set-cookie"];
    //eslint-disable-next-line no-console
    console.log("cookies: ", cookies);

    expect(response0.statusCode).to.equal(204);
    const response1 = await request.post(`${url}/command/${domain}/${action}`, {
      body: {
        payload,
        headers: {
          issued: stringDate()
        }
      },
      headers: {
        Cookie: cookies
      }
    });
    //eslint-disable-next-line no-console
    console.log("response1: ", response1);
    expect(response0.statusCode).to.equal(204);
  });
  // it("should return an error if incorrect params", async () => {
  //   const response = await post(address, {});
  //   expect(response.statusCode).to.be.at.least(400);
  // });
  // it("should return successfully", async () => {
  //   const name = "Some-name";
  //   const context = "some-context";
  //   const response = await request.post(url, {
  //     message: {
  //       data: Buffer.from(
  //         JSON.stringify({ headers: { context }, payload: { name } })
  //       )
  //     }
  //   });

  //   expect(response.statusCode).to.equal(204);

  //   const [view] = await viewStore({
  //     name: process.env.TARGET_NAME,
  //     domain: process.env.TARGET_DOMAIN,
  //     service: process.env.SERVICE,
  //     network: process.env.NETWORK
  //   })
  //     .read({ name })

  //   expect(view.name).to.equal(name);

  //   const deletedResult = await viewStore({
  //     name: process.env.TARGET_NAME,
  //     domain: process.env.TARGET_DOMAIN,
  //     service: process.env.SERVICE,
  //     network: process.env.NETWORK
  //   })
  //     .delete(view.id)

  //   expect(deletedResult.deletedCount).to.equal(1);
  // });
  // // it("should return an error if incorrect params", async () => {
  // //   const name = 3;
  // //   const response = await request.post(url, {
  // //     headers: {
  // //       issued: stringDate()
  // //     },
  // //     payload: {
  // //       name
  // //     }
  // //   });

  // //   expect(response.statusCode).to.equal(400);
  // // });
});
