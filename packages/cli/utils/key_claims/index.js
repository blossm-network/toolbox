import fact from "@blossm/fact-rpc";
import { invalidCredentials } from "@blossm/errors";
import { compare } from "@blossm/crypt";

//TODO write unit tests
export default ({ token }) =>
  async ({ root, secret }) => {
    const { body: key } = await fact({
      name: "state",
      domain: "key",
      service: "system",
      ...(process.env.CORE_NETWORK && { network: process.env.CORE_NETWORK }),
    })
      .set({ token: { internalFn: token } })
      // The secret stays here: the fact returns the stored hash to compare with.
      .read({ root });

    if (!key) throw invalidCredentials.message("This key wasn't found.");

    if (!(await compare(secret, key.secret)))
      throw invalidCredentials.message("This secret isn't right.");

    return {
      context: {
        network: key.network,
        key: {
          root: key.root,
          service: "core",
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
