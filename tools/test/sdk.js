import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { PassThrough } from "node:stream";

const root = fileURLToPath(new URL("../../", import.meta.url));
const dependency = (owner, name) =>
  createRequire(join(root, owner, "package.json"))(name);

for (const [owner, name, constructor, methods] of [
  [
    "kms",
    "@google-cloud/kms",
    "KeyManagementServiceClient",
    ["createCryptoKey", "getPublicKey", "asymmetricSign", "decrypt", "encrypt"],
  ],
  [
    "queue",
    "@google-cloud/tasks",
    "CloudTasksClient",
    ["createTask", "createQueue", "getQueue"],
  ],
  [
    "schedule",
    "@google-cloud/scheduler",
    "CloudSchedulerClient",
    ["createJob", "deleteJob", "getJob"],
  ],
]) {
  test(`${name} retains the client's resource and RPC surface`, async () => {
    const sdk = dependency(`packages/vendors/gcp/${owner}`, name);
    const client = new sdk[constructor]({ projectId: "offline-audit" });
    for (const method of methods)
      assert.equal(typeof client[method], "function");
    if (owner === "kms")
      assert.equal(
        client.cryptoKeyVersionPath("p", "l", "r", "k", "1"),
        "projects/p/locations/l/keyRings/r/cryptoKeys/k/cryptoKeyVersions/1",
      );
    if (owner === "queue")
      assert.equal(
        client.queuePath("p", "l", "q"),
        "projects/p/locations/l/queues/q",
      );
    if (owner === "schedule")
      assert.equal(
        client.jobPath("p", "l", "j"),
        "projects/p/locations/l/jobs/j",
      );
    await client.close();
  });
}

test("PubSub and Storage retain the resource APIs used by adapters", async () => {
  const { PubSub } = dependency(
    "packages/vendors/gcp/pubsub",
    "@google-cloud/pubsub",
  );
  const pubsub = new PubSub({ projectId: "offline-audit" });
  const topic = pubsub.topic("events");
  assert.equal(topic.name, "projects/offline-audit/topics/events");
  assert.equal(typeof topic.publishMessage, "function");
  assert.equal(typeof topic.subscription("reader").create, "function");
  await pubsub.close();
  const { Storage } = dependency(
    "packages/vendors/gcp/storage",
    "@google-cloud/storage",
  );
  const storage = new Storage({ projectId: "offline-audit" });
  const file = storage.bucket("audit").file("proof");
  for (const method of ["download", "save", "delete", "getSignedUrl"])
    assert.equal(typeof file[method], "function");
});

test("LoggingWinston constructs without remote log writes", () => {
  const { LoggingWinston } = dependency(
    "packages/vendors/gcp/log_transports",
    "@google-cloud/logging-winston",
  );
  const transport = new LoggingWinston({
    projectId: "offline-audit",
    redirectToStdout: true,
  });
  assert.equal(typeof transport.log, "function");
  transport.end();
});

test("Redis exposes the promise-based cache commands", () => {
  const redis = dependency("packages/vendors/redis", "redis");
  const client = redis.createClient();
  for (const method of ["hSet", "hGetAll", "expire", "pExpire", "pTTL", "del"])
    assert.equal(typeof client[method], "function");
  assert.equal(client.isOpen, false);
});

test("Twilio sends and lists through the real SDK with an in-memory transport", async () => {
  const twilio = dependency("packages/vendors/twilio/sms", "twilio");
  const requests = [];
  const client = twilio("AC" + "0".repeat(32), "audit-secret", {
    httpClient: {
      request: async (request) => {
        requests.push(request);
        return {
          statusCode: request.method.toUpperCase() === "POST" ? 201 : 200,
          headers: {},
          body: JSON.stringify(
            request.method.toUpperCase() === "POST"
              ? { sid: "SMaudit" }
              : { messages: [], next_page_uri: null },
          ),
        };
      },
    },
  });
  const { default: deps } =
    await import("../../packages/vendors/twilio/sms/deps.js");
  const { default: adapter } =
    await import("../../packages/vendors/twilio/sms/index.js");
  const original = deps.twilio;
  try {
    deps.twilio = () => client;
    const sms = adapter("audit", "audit");
    assert.equal(
      (
        await sms.send({
          to: "+15555550101",
          from: "+15555550102",
          body: "audit",
        })
      ).sid,
      "SMaudit",
    );
    assert.deepEqual(await sms.list({ limit: 1 }), []);
    assert.equal(requests.length, 2);
    assert.equal(requests[0].data.Body, "audit");
  } finally {
    deps.twilio = original;
  }
});

test("CLI color and filesystem lookup APIs retain their contracts", async () => {
  const chalk = dependency("packages/cli/blossm", "chalk").default;
  assert.equal(typeof chalk.red("audit"), "string");
  const { findUp } = dependency("packages/cli/utils/cli_root_dir", "find-up");
  assert.equal(
    await findUp("package.json", {
      cwd: join(root, "packages/cli/utils/cli_root_dir"),
    }),
    join(root, "packages/cli/utils/cli_root_dir/package.json"),
  );
});

test(
  "Inquirer retains prompt array and answer behavior with isolated streams",
  { timeout: 5000 },
  async () => {
    const inquirer = dependency(
      "packages/cli/utils/normalize_cli",
      "inquirer",
    ).default;
    const input = new PassThrough();
    const output = new PassThrough();
    const prompt = inquirer.createPromptModule({ input, output });
    const result = prompt([
      { type: "select", name: "answer", message: "Audit", choices: ["audit"] },
    ]);
    let submitted = false;
    output.on("data", (chunk) => {
      if (!submitted && chunk.toString().includes("Audit")) {
        submitted = true;
        setImmediate(() => input.write("\r"));
      }
    });
    try {
      assert.deepEqual(await result, { answer: "audit" });
    } finally {
      input.end();
      output.end();
    }
  },
);
