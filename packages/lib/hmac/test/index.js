import { expect } from "chai";

import hmac from "../index.js";

const { create } = hmac;

describe("HMAC", () => {
  it("should create a unique HMAC hash", async () => {
    const secret = "test-secret";
    const message = "test-message";
    const hmacResult = await create({ secret, message });
    
    expect(hmacResult).to.be.a("string");
    expect(hmacResult).to.have.length(64); // SHA256 hex digest is 64 characters
    expect(hmacResult).to.match(/^[a-f0-9]+$/); // Should be hex string
  });

  it("should create different hashes for different messages with same secret", async () => {
    const secret = "test-secret";
    const message1 = "test-message-1";
    const message2 = "test-message-2";
    
    const hmac1 = await create({ secret, message: message1 });
    const hmac2 = await create({ secret, message: message2 });
    
    expect(hmac1).to.not.equal(hmac2);
  });

  it("should create different hashes for different secrets with same message", async () => {
    const secret1 = "test-secret-1";
    const secret2 = "test-secret-2";
    const message = "test-message";
    
    const hmac1 = await create({ secret: secret1, message });
    const hmac2 = await create({ secret: secret2, message });
    
    expect(hmac1).to.not.equal(hmac2);
  });

  it("should create consistent hashes for same input", async () => {
    const secret = "test-secret";
    const message = "test-message";
    
    const hmac1 = await create({ secret, message });
    const hmac2 = await create({ secret, message });
    
    expect(hmac1).to.equal(hmac2);
  });

  it("should handle special characters in message", async () => {
    const secret = "test-secret";
    const message = "test@email.com!@#$%^&*()";
    
    const hmacResult = await create({ secret, message });
    
    expect(hmacResult).to.be.a("string");
    expect(hmacResult).to.have.length(64);
    expect(hmacResult).to.match(/^[a-f0-9]+$/);
  });

  it("should handle empty message", async () => {
    const secret = "test-secret";
    const message = "";
    
    const hmacResult = await create({ secret, message });
    
    expect(hmacResult).to.be.a("string");
    expect(hmacResult).to.have.length(64);
    expect(hmacResult).to.match(/^[a-f0-9]+$/);
  });

  it("should handle empty secret", async () => {
    const secret = "";
    const message = "test-message";
    
    const hmacResult = await create({ secret, message });
    
    expect(hmacResult).to.be.a("string");
    expect(hmacResult).to.have.length(64);
    expect(hmacResult).to.match(/^[a-f0-9]+$/);
  });
});
