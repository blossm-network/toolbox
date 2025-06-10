module.exports = ({
  adminUser,
  adminUserPassword,
  adminDatabase,
  database,
  user,
  userPassword,
}) => {
  return {
    // image: "mongo:8.0",
    image: "mongodb/mongodb-community-server:latest",
    container_name: "mongodb",
    environment: {
      MONGO_INITDB_ROOT_USERNAME: `${adminUser}`,
      MONGO_INITDB_ROOT_PASSWORD: `${adminUserPassword}`,
      MONGO_INITDB_DATABASE: `${adminDatabase}`,
      MONGO_DATABASE: `${database}`,
      MONGO_USER: `${user}`,
      MONGO_USER_PASSWORD: `${userPassword}`,
    },
    volumes: [
      "./mongodb-init.sh:/docker-entrypoint-initdb.d/mongodb-init.sh:ro",
    ],
    ports: ["27017:27017"],
  };
};
