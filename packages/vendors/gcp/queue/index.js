import deps from "./deps.js";

let client;
const getClient = () => (client ||= new deps.Client());

// Read once. A failed read is not kept, so the next task tries again.
let identity;
const own = () =>
  (identity ||= deps.identity().catch((error) => {
    identity = undefined;
    throw error;
  }));

const create = async ({ project, location, name }) => {
  const parent = getClient().locationPath(project, location);

  const [response] = await getClient().createQueue({
    parent,
    queue: {
      name: getClient().queuePath(project, location, name),
    },
  });
  return response;
};

const enqueue =
  ({
    serviceAccountEmail,
    project = process.env.GCP_PROJECT,
    location = process.env.GCP_REGION,
    queue,
    wait = 0,
  }) =>
  async ({ url, data = {}, token, method = "post" }) => {
    const parent = getClient().queuePath(project, location, queue);

    // The task is delivered as the service that queued it, unless a caller
    // outside the platform names the account to deliver it as.
    const identity = token ? undefined : serviceAccountEmail || (await own());

    const string = JSON.stringify(data);

    const body = Buffer.from(string).toString("base64");

    const task = {
      httpRequest: {
        httpMethod: method.toUpperCase(),
        url,
        ...(!token && {
          oidcToken: {
            // The task is delivered as the service that queued it, so its
            // target decides exactly which services may queue work for it.
            serviceAccountEmail: identity,
            audience: (() => {
              try {
                const u = new URL(url);
                return `${u.protocol}//${u.host}`;
              } catch {
                return url;
              }
            })(),
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

    const [response] = await getClient().createTask(request);

    return response;
  };

export default {
  get __client() {
    return getClient();
  },
  create,
  enqueue,
};
