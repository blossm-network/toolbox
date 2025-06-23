import { CloudSchedulerClient } from "@google-cloud/scheduler";

const __client = new CloudSchedulerClient();

const create = async ({
  url,
  data,
  schedule,
  timeZone,
  token,
  project,
  location,
}) => {
  const parent = __client.locationPath(project, location);

  const string = JSON.stringify(data);
  const body = Buffer.from(string);

  const job = {
    httpTarget: {
      uri: url,
      httpMethod: "POST",
      oauthToken: token,
      body,
    },
    schedule,
    timeZone,
  };

  const request = {
    parent,
    job,
  };

  const [response] = await __client.createJob(request);

  return response;
};

export default {
  __client,
  create,
};