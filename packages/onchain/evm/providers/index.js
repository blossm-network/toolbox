import deps from "./deps.js";

const getProvider = (rpcUrl) => {
  if (rpcUrl == undefined || rpcUrl === "") {
    throw deps.internalServer.message("rpcUrl is required");
  }

  if (
    typeof rpcUrl !== "string" ||
    !URL.canParse(rpcUrl) ||
    !["http:", "https:"].includes(new URL(rpcUrl).protocol)
  ) {
    throw deps.internalServer.message(
      "rpcUrl must be an absolute HTTP or HTTPS URL"
    );
  }

  return deps.createPublicClient({
    transport: deps.http(rpcUrl),
  });
};

export default {
  getProvider,
};
