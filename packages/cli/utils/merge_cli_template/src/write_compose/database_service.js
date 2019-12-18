module.exports = ({
  adminUser,
  adminUserPassword,
  adminDatabase,
  database,
  user,
  userPassword
}) => {
  return {
    image: "mongo:latest",
    container_name: "mongodb",
    environment: {
      MONGODB_INITDB_ROOT_USERNAME: `${adminUser}`,
      MONGODB_INITDB_ROOT_PASSWORD: `${adminUserPassword}`,
      MONGODB_INITDB_DATABASE: `${adminDatabase}`,
      MONGODB_DATABASE: `${database}`,
      MONGODB_USER: `${user}`,
      MONGODB_USER_PASSWORD: `${userPassword}`
    },
    volumes: [
      "./mongodb-init.sh:/docker-entrypoint-initdb.d/mongodb-init.sh:ro"
    ],
    ports: ["27017:27017"]
  };
};
