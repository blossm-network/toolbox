import deps from "./deps.js";

const client = new deps.CloudSchedulerClient();

export default async ({
  url,
  data,
  schedule,
  timeZone,
  token,
  project,
  location,
}) => {
  const parent = client.locationPath(project, location);

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

  const [response] = await client.createJob(request);

  return response;
};
