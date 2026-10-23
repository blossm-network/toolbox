import { expect } from "chai";
import deps from "../deps.js";

describe("Dwolla document multipart encoding", () => {
  it("escapes filenames without adding headers or changing file bytes", () => {
    const form = new deps.FormData();
    const bytes = Buffer.from([0, 1, 255, 13, 10]);
    form.append("file", bytes, {
      filename: 'proof.txt"\r\nX-Injected: yes\r\nIgnore: "x',
      contentType: "application/octet-stream",
    });

    const encoded = form.getBuffer();
    expect(encoded.includes(bytes)).to.equal(true);
    expect(encoded.toString()).not.to.include("\r\nX-Injected: yes\r\n");
    expect(encoded.toString()).to.include("%0D%0A");
  });
});
