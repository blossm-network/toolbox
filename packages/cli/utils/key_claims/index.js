import fact from "@blossm/fact-rpc";
import { invalidCredentials } from "@blossm/errors";
import { compare } from "@blossm/crypt";

//TODO write unit tests
export default ({ token }) => async ({ root, secret }) => {
  const { body: key } = await fact({
    name: "state",
    domain: "key",
    service: "system",
    ...(process.env.BASE_NETWORK && { network: process.env.BASE_NETWORK }),
  })
    .set({ token: { internalFn: token } })
    .read({ root, query: { secret } });

  if (!key) throw invalidCredentials.message("This key wasn't found.");

  if (!(await compare(secret, key.secret)))
    throw invalidCredentials.message("This secret isn't right.");

  return {
    context: {
      network: key.network,
      key: {
        root: key.root,
        service: "base",
        network: process.env.NETWORK,
      },
      principal: key.principal,
      scene: key.scene,
      ...(key.domain && {
        [key.domain.name]: {
          root: key.domain.root,
          service: key.domain.service,
          network: key.domain.network,
        },
      }),
    },
  };
};
