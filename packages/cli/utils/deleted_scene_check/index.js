import fact from "@blossm/fact-rpc";
import { invalidCredentials } from "@blossm/errors";

export default async ({ scene, token: { internalFn, externalFn } }) => {
  const { body: deleted } = await fact({
    name: "deleted",
    domain: "scene",
    service: scene.service,
    network: scene.network,
  })
    .set({
      token: {
        internalFn,
        externalFn,
      },
      context: { scene },
    })
    .read();

  if (deleted) throw invalidCredentials.message("This scene has been deleted.");
};
