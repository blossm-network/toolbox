import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake, useFakeTimers } from "sinon";

import queue from "../index.js";

chai.use(sinonChai);
const { expect } = chai;

let clock;
const now = new Date();

const queueParent = "some-queue-parent";
const locationParent = "some-location-parent";
const taskResponse = "some-task-response";
const queueResponse = "some-queue-response";
const url = "https://some-url.co";
const data = { a: 1 };
const project = "some-project";
const location = "some-location";
const name = "some-name";
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
    restore();
  });

  it("should call create with the correct params", async () => {
    const queuePathFake = fake.returns(queueParent);
    const locationPathFake = fake.returns(locationParent);
    const createQueueFake = fake.returns([queueResponse]);
    replace(queue.__client, "locationPath", locationPathFake);
    replace(queue.__client, "queuePath", queuePathFake);
    replace(queue.__client, "createQueue", createQueueFake);
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
    const queuePathFake = fake.returns(queueParent);
    const createTaskFake = fake.returns([taskResponse]);
    replace(queue.__client, "queuePath", queuePathFake);
    replace(queue.__client, "createTask", createTaskFake);
    const result = await queue.enqueue({
      serviceAccountEmail,
      project,
      queue: name,
      computeUrlId: "custom-compute-url-id",
      location: "custom-region",
    })({
      url,
      data,
      method: "put",
    });
    expect(queuePathFake).to.have.been.calledWith(project, "custom-region", name);
    expect(createTaskFake).to.have.been.calledWith({
      parent: queueParent,
      task: {
        httpRequest: {
          url,
          httpMethod: "PUT",
          oidcToken: {
            serviceAccountEmail,
            audience: url 
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
  it("should call enqueue with the correct params and clean URL correctly for audience", async () => {
    const queuePathFake = fake.returns(queueParent);
    const createTaskFake = fake.returns([taskResponse]);
    replace(queue.__client, "queuePath", queuePathFake);
    replace(queue.__client, "createTask", createTaskFake);
    const narrowUrl = url + "/asdf?a=1&b=2";
    const result = await queue.enqueue({
      serviceAccountEmail,
      project,
      queue: name,
      computeUrlId: "custom-compute-url-id",
      location: "custom-region",
    })({
      url: narrowUrl,
      data,
      method: "put",
    });
    expect(queuePathFake).to.have.been.calledWith(project, "custom-region", name);
    expect(createTaskFake).to.have.been.calledWith({
      parent: queueParent,
      task: {
        httpRequest: {
          url: narrowUrl,
          httpMethod: "PUT",
          oidcToken: {
            serviceAccountEmail,
            audience: url 
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
    const queuePathFake = fake.returns(queueParent);
    const createTaskFake = fake.returns([taskResponse]);
    replace(queue.__client, "queuePath", queuePathFake);
    replace(queue.__client, "createTask", createTaskFake);
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
            audience: url,
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
    const queuePathFake = fake.returns(queueParent);
    const createTaskFake = fake.returns([taskResponse]);
    replace(queue.__client, "queuePath", queuePathFake);
    replace(queue.__client, "createTask", createTaskFake);
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
