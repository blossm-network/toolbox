
import { CloudTasksClient } from "@google-cloud/tasks";

const __client = new CloudTasksClient();

const create = async ({ project, location, name }) => {
  const parent = __client.locationPath(project, location);

  const [response] = await __client.createQueue({
    parent,
    queue: {
      name: __client.queuePath(project, location, name),
    },
  });
  return response;
};

const enqueue = ({
  serviceAccountEmail,
  project = process.env.GCP_PROJECT,
  location = process.env.GCP_REGION,
  computeUrlId = process.env.GCP_COMPUTE_URL_ID,
  queue,
  wait = 0,
}) => async ({ url, data = {}, token, hash, name, method = "post" }) => {
  const parent = __client.queuePath(project, location, queue);

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
              audience: `https://${location}-${name}-${hash}-${computeUrlId}.${location}.run.app`,
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

  const [response] = await __client.createTask(request);

  return response;
};

export default {
  __client,
  create,
  enqueue,
};