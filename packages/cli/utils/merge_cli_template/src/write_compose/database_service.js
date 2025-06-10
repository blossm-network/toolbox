module.exports = ({
  adminUser,
  adminUserPassword,
  adminDatabase,
  database,
  user,
  userPassword,
}) => {
  return {
    image: "mongo:4.2",
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
