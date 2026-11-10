import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  nodeImage,
  mongoImage,
  dockerImage,
} from "../../packages/cli/utils/merge_cli_template/runtime.js";
import install from "../../packages/cli/utils/merge_cli_template/src/write_build/steps/yarn_install.js";
import unitTests from "../../packages/cli/utils/merge_cli_template/src/write_build/steps/unit_tests.js";
import baseUnitTests from "../../packages/cli/utils/merge_cli_template/src/write_build/steps/base_unit_tests.js";
import integrationTests from "../../packages/cli/utils/merge_cli_template/src/write_build/steps/integration_tests.js";
import baseIntegrationTests from "../../packages/cli/utils/merge_cli_template/src/write_build/steps/base_integration_tests.js";
import writeEnv from "../../packages/cli/utils/merge_cli_template/src/write_build/steps/write_env.js";

import database from "../../packages/cli/utils/merge_cli_template/src/write_compose/database_service.js";
import composeUp from "../../packages/cli/utils/merge_cli_template/src/write_build/steps/docker_compose_up.js";
import composePs from "../../packages/cli/utils/merge_cli_template/src/write_build/steps/docker_compose_processes.js";
import composeLogs from "../../packages/cli/utils/merge_cli_template/src/write_build/steps/docker_compose_logs.js";

const root = fileURLToPath(new URL("../../", import.meta.url));

test("generated runtime copies match the single version owner", () => {
  execFileSync(process.execPath, ["tools/runtime.js"], { cwd: root });
});

test("generated services select pinned supported runtime images", () => {
  for (const step of [
    install,
    unitTests,
    baseUnitTests,
    integrationTests(),
    baseIntegrationTests(),
    writeEnv(),
  ]) {
    assert.equal(step.name, nodeImage);
  }
  assert.equal(writeEnv().entrypoint, "node");
  assert.equal(database({}).image, mongoImage);
  for (const step of [composeUp, composePs, composeLogs]) {
    assert.equal(step.name, dockerImage);
    assert.equal(step.entrypoint, "docker");
    assert.equal(step.args[0], "compose");
  }
  for (const image of [nodeImage, mongoImage, dockerImage]) {
    assert.match(image, /@sha256:[a-f0-9]{64}$/);
  }
});
