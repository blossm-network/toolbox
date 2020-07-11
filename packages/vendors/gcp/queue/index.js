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

exports.enqueue = ({
  serviceAccountEmail,
  project = process.env.GCP_PROJECT,
  location = process.env.GCP_REGION,
  queue,
  wait = 0,
}) => async ({ url, data = {}, token, hash, name, method = "post" }) => {
  const parent = client.queuePath(project, location, queue);

  const string = JSON.stringify(data);

  const body = Buffer.from(string).toString("base64");
  const task = {
    httpRequest: {
      httpMethod: method.toUpperCase(),
      url,
      ...(!token && {
        oidcToken: {
          serviceAccountEmail:
            serviceAccountEmail ||
            `executer@${project}.iam.gserviceaccount.com`,
          ...(hash &&
            name && {
              audience: `https://${process.env.GCP_REGION}-${name}-${hash}-${process.env.GCP_COMPUTE_URL_ID}-uc.a.run.app`,
            }),
        },
      }),
      headers: {
        "content-type": "application/json",
        ...(token && { authorization: `Bearer ${token}` }),
      },
      body,
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
