// Owns the runtime versions used by Toolbox and generated services.
export const nodeVersion = "24.22.1";
export const nodeImage = `node:${nodeVersion}@sha256:d862bb5d082c5ae0210ac07e8c0344cb8cf7bef6d78e9b8c50c179da923108ea`;
export const nodeSlimImage = `node:${nodeVersion}-slim@sha256:be8204d4bd327363357f532187b752ff62759c31bedf98e9e18fc08c9cbd605c`;
export const mongoImage =
  "mongo:8.0.34@sha256:b9924c330a8bbc5800fe9c69f04a84e221eca7b28fd049a0354147d9908fa142";
export const dockerImage =
  "docker:29.9.2-cli@sha256:5e6baf67325a79f64ed3bed6863954d5e05d0f3d4e57cbdb14809346814bbfdb";
