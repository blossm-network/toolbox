const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, fake, useFakeTimers } = require("sinon");
const gcp = require("@google-cloud/tasks");

let clock;
const now = new Date();

let queue;

const queueParent = "some-queue-parent";
const locationParent = "some-location-parent";
const taskResponse = "some-task-response";
const queueResponse = "some-queue-response";
const queuePathFake = fake.returns(queueParent);
const locationPathFake = fake.returns(locationParent);
const createTaskFake = fake.returns([taskResponse]);
const createQueueFake = fake.returns([queueResponse]);
const url = "some-url";
const data = { a: 1 };
const project = "some-project";
const location = "some-location";
const name = "some-name";
const operationName = "some-operation-name";
const operationHash = "some-operation-hash";
const serviceAccountEmail = "some-service-account-email";

const region = "some-region";
const computeUrlId = "some-compute-url-id";

process.env.GCP_PROJECT = project;
process.env.GCP_REGION = region;
process.env.GCP_COMPUTE_URL_ID = computeUrlId;

describe("Queue", () => {
  beforeEach(() => {
    clock = useFakeTimers(now.getTime());
  });
  afterEach(() => {
    clock.restore();
  });
  before(() => {
    const client = function () {};
    client.prototype.queuePath = queuePathFake;
    client.prototype.locationPath = locationPathFake;
    client.prototype.createTask = createTaskFake;
    client.prototype.createQueue = createQueueFake;

    replace(gcp, "CloudTasksClient", client);

    queue = require("..");
  });
  after(() => {
    restore();
  });

  it("should call create with the correct params", async () => {
    const result = await queue.create({
      project,
      location,
      name,
    });
    expect(locationPathFake).to.have.been.calledWith(project, location);
    expect(queuePathFake).to.have.been.calledWith(project, location, name);
    expect(createQueueFake).to.have.been.calledWith({
      parent: locationParent,
      queue: {
        name: queueParent,
      },
    });
    expect(result).to.equal(queueResponse);
  });
  it("should call enqueue with the correct params", async () => {
    const result = await queue.enqueue({
      serviceAccountEmail,
      project,
      queue: name,
      location,
      method: "put",
    })({
      url,
      data,
      name: operationName,
      hash: operationHash,
    });
    expect(queuePathFake).to.have.been.calledWith(project, location);
    expect(createTaskFake).to.have.been.calledWith({
      parent: queueParent,
      task: {
        httpRequest: {
          url,
          httpMethod: "PUT",
          oidcToken: {
            serviceAccountEmail,
            audience: `https://${region}-${operationName}-${operationHash}-${computeUrlId}-uc.a.run.app`,
          },
          headers: {
            "content-type": "application/json",
          },
          body: Buffer.from(JSON.stringify(data)).toString("base64"),
        },
        scheduleTime: {
          seconds: Date.now() / 1000,
        },
      },
    });
    expect(result).to.equal(taskResponse);
  });
  it("should call enqueue with the correct params with wait and optionals missing", async () => {
    const result = await queue.enqueue({
      project,
      queue: name,
      wait: 4,
      location,
    })({ url });
    expect(queuePathFake).to.have.been.calledWith(project, location);
    expect(createTaskFake).to.have.been.calledWith({
      parent: queueParent,
      task: {
        httpRequest: {
          url,
          httpMethod: "POST",
          oidcToken: {
            serviceAccountEmail:
              "executer@some-project.iam.gserviceaccount.com",
          },
          headers: {
            "content-type": "application/json",
          },
          body: Buffer.from(JSON.stringify({})).toString("base64"),
        },
        scheduleTime: {
          seconds: 4 + Date.now() / 1000,
        },
      },
    });
    expect(result).to.equal(taskResponse);
  });
  it("should call enqueue with the correct params with token", async () => {
    const token = "some-token";
    const result = await queue.enqueue({
      serviceAccountEmail,
      project,
      queue: name,
      location,
    })({
      url,
      data,
      token,
    });
    expect(queuePathFake).to.have.been.calledWith(project, location);
    expect(createTaskFake).to.have.been.calledWith({
      parent: queueParent,
      task: {
        httpRequest: {
          url,
          httpMethod: "POST",
          headers: {
            "content-type": "application/json",
            authorization: "Bearer some-token",
          },
          body: Buffer.from(JSON.stringify(data)).toString("base64"),
        },
        scheduleTime: {
          seconds: Date.now() / 1000,
        },
      },
    });
    expect(result).to.equal(taskResponse);
  });
});
