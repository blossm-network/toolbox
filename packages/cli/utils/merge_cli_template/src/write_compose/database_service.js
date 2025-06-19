export default ({
  adminDatabase,
  database,
  user,
  userPassword,
}) => {
  return {
    image: "mongo:8.0.10",
    container_name: "mongodb",
    environment: {
      MONGODB_INITDB_DATABASE: `${adminDatabase}`,
      MONGODB_DATABASE: `${database}`,
      MONGODB_USER: `${user}`,
      MONGODB_USER_PASSWORD: `${userPassword}`,
    },
    volumes: [
      "./mongodb-init.sh:/docker-entrypoint-initdb.d/mongodb-init.sh:ro",
    ],
    ports: ["27017:27017"],
  };
};
