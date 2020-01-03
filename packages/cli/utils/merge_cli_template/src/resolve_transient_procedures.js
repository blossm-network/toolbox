const rootDir = require("@blossm/cli-root-dir");
const path = require("path");
const fs = require("fs");
const yaml = require("yaml");

const targetIsConfig = (target, config) => {
  if (config.context != target.context) return false;
  for (const property in target) {
    if (config[property] != target[property]) return false;
  }
  return true;
};

const proceduresEqual = (target0, target1) => {
  for (const property in target0) {
    if (target1[property] != target0[property]) return false;
  }
  return true;
};

const findProceduresForTarget = (target, dir) => {
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);

    if (file == "blossm.yaml" || file == "blossm.yml") {
      const blossmConfig = yaml.parse(fs.readFileSync(filePath, "utf8"));

      //If the domain is not the same, the target wont be in this directory.
      if (blossmConfig.domain != target.domain) return [];
      if (targetIsConfig(target, blossmConfig)) {
        return blossmConfig.testing.procedures || [];
      }
    } else if (fs.statSync(filePath).isDirectory()) {
      const procedures = findProceduresForTarget(target, filePath);
      if (procedures.length > 0) return procedures;
    }
  }

  return [];
};

const findProcedures = (procedures, dir, allProcedures) => {
  const newProcedures = [];
  for (const procedure of procedures) {
    const foundProcedures = findProceduresForTarget(procedure, dir).filter(
      p => {
        for (const s of newProcedures) {
          if (proceduresEqual(s, p)) return false;
        }
        return true;
      }
    );
    allProcedures.push(...foundProcedures);
  }

  const difference = newProcedures.filter(t => {
    for (const procedure of allProcedures) {
      if (proceduresEqual(procedure, t)) return false;
    }
    return true;
  });

  if (difference.length == 0) return allProcedures;
  return findProcedures(difference, dir, [...allProcedures, ...difference]);
};

module.exports = procedures => {
  if (!procedures) return;
  const dir = rootDir.path();
  return findProcedures(procedures, dir, procedures);
};
