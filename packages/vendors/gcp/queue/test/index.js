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
const token = "some-token";
const name = "some-name";
const serviceAccountEmail = "some-service-account-email";
const audience = "some-audience";

process.env.GCP_PROJECT = project;

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
      url,
      data,
      serviceAccountEmail,
      audience,
      project,
      queue: name,
      location,
    });
    expect(queuePathFake).to.have.been.calledWith(project, location);
    expect(createTaskFake).to.have.been.calledWith({
      parent: queueParent,
      task: {
        httpRequest: {
          url,
          httpMethod: "POST",
          oidcToken: {
            serviceAccountEmail,
            audience,
          },
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(data),
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
      url,
      token,
      project,
      queue: name,
      wait: 4,
      location,
    });
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
          body: JSON.stringify({}),
        },
        scheduleTime: {
          seconds: 4 + Date.now() / 1000,
        },
      },
    });
    expect(result).to.equal(taskResponse);
  });
});
