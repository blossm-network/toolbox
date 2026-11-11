import assert from "assert";
import fs from "fs";

describe("Generated build steps", () => {
  it("installs production dependencies from the build lock and excludes workspace artifacts", () => {
    const template = new URL(
      "../../utils/merge_cli_template/template/",
      import.meta.url,
    );
    const dockerfile = fs.readFileSync(new URL("Dockerfile", template), "utf8");
    const ignored = fs
      .readFileSync(new URL(".dockerignore", template), "utf8")
      .trim()
      .split("\n");
    assert(dockerfile.includes("COPY package.json yarn.lock ./"));
    assert(
      dockerfile.includes("RUN yarn install --production --frozen-lockfile"),
    );
    assert(!dockerfile.includes("npm install"));
    for (const entry of [
      "node_modules",
      ".git",
      ".env",
      ".env.*",
      "test",
      "base_test",
      "build.yaml",
      "docker-compose.yaml",
      ".aws",
      ".gcloud",
      ".config/gcloud",
      "*.pem",
      "*.key",
      "*.p12",
      "npm-debug.log*",
      "yarn-error.log*",
      ".blossm-cloud-run-env.json",
    ]) {
      assert(ignored.includes(entry), entry);
    }
  });
});
