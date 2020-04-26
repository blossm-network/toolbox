const rootDir = require("@blossm/cli-root-dir");
const path = require("path");
const fs = require("fs");
const yaml = require("yaml");

const eventsForStore = (config) =>
  config.actions.map((action) => {
    return {
      action,
      domain: config.domain,
      service: config.service,
    };
  });

const dependencyIsConfig = (dependency, config) => {
  if (config.procedure != dependency.procedure) return false;
  for (const property in dependency) {
    if (config[property] != dependency[property]) return false;
  }
  return true;
};

const objectsEqual = (obj0, obj1) => {
  for (const property in obj0) {
    if (obj1[property] != obj0[property]) return false;
  }
  return true;
};

const resolveTransientDependencies = (config) => {
  switch (config.procedure) {
    case "command":
      return [
        ...(config.testing.dependencies || []),
        {
          domain: config.domain,
          service: config.service,
          procedure: "event-store",
        },
      ];
    case "projection":
      return [
        ...(config.testing.dependencies || []),
        {
          name: config.name,
          domain: config.domain,
          service: config.service,
          procedure: "view-store",
        },
      ];
    default:
      return (config.testing || {}).dependencies || [];
  }
};

const findDependenciesAndEventsForDependency = (dependency, dir) => {
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);

    if (file == "blossm.yaml" || file == "blossm.yml") {
      const blossmConfig = yaml.parse(fs.readFileSync(filePath, "utf8"));

      //If the domain is not the same, the procedure wont be in this directory.
      if (blossmConfig.domain != dependency.domain)
        return { dependencies: [], events: [] };
      if (dependencyIsConfig(dependency, blossmConfig)) {
        return {
          dependencies: resolveTransientDependencies(blossmConfig),
          events:
            blossmConfig.procedure == "event-store"
              ? eventsForStore(blossmConfig)
              : [],
        };
      }
    } else if (fs.statSync(filePath).isDirectory()) {
      const { dependencies, events } = findDependenciesAndEventsForDependency(
        dependency,
        filePath
      );
      if (dependencies.length > 0 || events.length > 0)
        return { dependencies, events };
    }
  }

  return { dependencies: [], events: [] };
};

const findDependenciesAndEvents = (
  dependencies,
  dir,
  allDependencies,
  allEvents
) => {
  const newDependencies = [];
  const newEvents = [];
  for (const dependency of dependencies) {
    const {
      dependencies: foundDependencies,
      events: foundEvents,
    } = findDependenciesAndEventsForDependency(dependency, dir);
    const filteredFoundDependencies = foundDependencies.filter((p) => {
      for (const s of newDependencies) {
        if (objectsEqual(s, p)) return false;
      }
      return true;
    });
    const filteredFoundEvents = foundEvents.filter((e) => {
      for (const s of newEvents) {
        if (objectsEqual(s, e)) return false;
      }
      return true;
    });
    newDependencies.push(...filteredFoundDependencies);
    newEvents.push(...filteredFoundEvents);
  }

  const dependencyDifference = newDependencies.filter((p) => {
    for (const dependency of allDependencies) {
      if (objectsEqual(dependency, p)) return false;
    }
    return true;
  });

  const eventDifference = newEvents.filter((e) => {
    for (const event of allEvents) {
      if (objectsEqual(event, e)) return false;
    }
    return true;
  });

  if (dependencyDifference.length == 0)
    return {
      dependencies: allDependencies,
      events: [...allEvents, ...eventDifference],
    };

  return findDependenciesAndEvents(
    dependencyDifference,
    dir,
    [...allDependencies, ...dependencyDifference],
    [...allEvents, ...eventDifference]
  );
};

module.exports = (dependencies) => {
  if (!dependencies) return;
  const dir = rootDir.path();
  return findDependenciesAndEvents(dependencies, dir, dependencies, []);
};
