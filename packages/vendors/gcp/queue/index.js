const { CloudTasksClient } = require("@google-cloud/tasks");
const client = new CloudTasksClient();

exports.create = async ({ project, location, name }) => {
  const parent = client.locationPath(project, location);

  const [response] = await client.createQueue({
    parent,
    queue: {
      name: client.queuePath(project, location, name),
    },
  });
  return response;
};

exports.enqueue = async ({
  url,
  data = {},
  serviceAccountEmail,
  audience,
  project,
  location,
  queue,
  wait = 0,
}) => {
  const parent = client.queuePath(project, location, queue);

  const task = {
    httpRequest: {
      httpMethod: "POST",
      url,
      oidcToken: {
        serviceAccountEmail:
          serviceAccountEmail || `executer@${project}.iam.gserviceaccount.com`,
        ...(audience && { audience }),
      },
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
    scheduleTime: {
      seconds: wait + Date.now() / 1000,
    },
  };

  const request = {
    parent,
    task,
  };

  const [response] = await client.createTask(request);

  return response;
};
