const { expect } = require("chai");
const { imageUrl } = require("..");

describe("Image url", () => {
  it("should not contain errors if the image url is formatted correctly", () => {
    const validImageUrls = [
      "https://upload.wikimedia.org/wikipedia/commons/2/25/Red.svg",
      "https://media.giphy.com/media/3o72EWdzDI0wgdAq7S/giphy.gif"
    ];
    for (const url of validImageUrls) {
      const error = imageUrl(url);
      expect(error).to.be.undefined;
    }
  });
});

describe("Invalid image url", () => {
  it("should contain one error if image url is bad", () => {
    const invalidImageUrls = ["bad", "https://some.mov"];
    for (const url of invalidImageUrls) {
      const response = imageUrl(url);
      expect(response.message).to.exist;
    }
  });
});
