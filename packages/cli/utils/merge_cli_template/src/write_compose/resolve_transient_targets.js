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

const targetsEqual = (target0, target1) => {
  for (const property in target0) {
    if (target1[property] != target0[property]) return false;
  }
  return true;
};

const findTargetsForTarget = (target, dir) => {
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);

    if (file == "blossm.yaml" || file == "blossm.yml") {
      const blossmConfig = yaml.parse(fs.readFileSync(filePath, "utf8"));

      //If the domain is not the same, the target wont be in this directory.
      if (blossmConfig.domain != target.domain) return [];
      if (targetIsConfig(target, blossmConfig)) {
        return blossmConfig.targets || [];
      }
    } else if (fs.statSync(filePath).isDirectory()) {
      const targets = findTargetsForTarget(target, filePath);
      if (targets.length > 0) return targets;
    }
  }

  return [];
};

const findTargets = (targets, dir, totalTargets) => {
  const newTargets = [];
  for (const target of targets) {
    const foundTargets = findTargetsForTarget(target).filter(t => {
      for (const s of newTargets) {
        if (targetsEqual(s, t)) return false;
      }
      return true;
    });
    newTargets.push(...foundTargets);
  }

  const difference = newTargets.filter(t => {
    for (const target of totalTargets) {
      if (targetsEqual(target, t)) return false;
    }
    return true;
  });

  if (difference.length == 0) return totalTargets;
  return findTargets(difference, dir, [...totalTargets, ...difference]);
};

module.exports = targets => {
  if (!targets) return;
  const dir = rootDir.path();
  return findTargets(targets, dir, targets);
};
