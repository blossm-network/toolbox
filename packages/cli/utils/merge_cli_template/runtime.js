// Owns the runtime versions used by Toolbox and generated services.
export const nodeVersion = "24.22.1";
export const nodeImage = `node:${nodeVersion}@sha256:6449e19d8184d84062525b6a7524def03146c2cb04a7f08b076680d0e8e4240a`;
export const nodeSlimImage = `node:${nodeVersion}-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205`;
export const mongoImage =
  "mongo:8.0.34@sha256:4a4ab5d4834207389e0d7270fac988e21ffedccecba77991a552f755df229907";
export const dockerImage =
  "docker:29.9.2-cli@sha256:5e6baf67325a79f64ed3bed6863954d5e05d0f3d4e57cbdb14809346814bbfdb";
