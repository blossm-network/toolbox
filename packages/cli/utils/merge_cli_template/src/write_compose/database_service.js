export default ({ adminDatabase, databases, user, userPassword }) => {
  return {
    image: "mongo:8.0.10",
    container_name: "mongodb",
    command: ["mongod", "--replSet", "blossm-test", "--bind_ip_all"],
    environment: {
      MONGODB_INITDB_DATABASE: `${adminDatabase}`,
      MONGODB_DATABASES: JSON.stringify(databases),
      MONGODB_REPLICA_SET: "blossm-test",
      MONGODB_REPLICA_HOST: "mongodb:27017",
      MONGODB_USER: `${user}`,
      MONGODB_USER_PASSWORD: `${userPassword}`,
    },
    volumes: [
      "./mongodb-init.sh:/docker-entrypoint-initdb.d/mongodb-init.sh:ro",
    ],
    ports: ["127.0.0.1:27017:27017"],
    healthcheck: {
      test: [
        "CMD",
        "bash",
        "/docker-entrypoint-initdb.d/mongodb-init.sh",
        "ready",
      ],
      interval: "2s",
      timeout: "10s",
      retries: 30,
      start_period: "5s",
    },
  };
};
