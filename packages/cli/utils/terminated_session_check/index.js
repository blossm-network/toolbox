import fact from "@blossm/fact-rpc";
import { invalidCredentials } from "@blossm/errors";

export default async ({ session, token: { internalFn, externalFn } }) => {
  const { body: terminated } = await fact({
    name: "terminated",
    domain: "session",
    service: session.service,
    network: session.network,
  })
    .set({
      token: {
        internalFn,
        externalFn,
      },
      context: { session },
    })
    .read();

  if (terminated)
    throw invalidCredentials.message("This token has been terminated.");
};
