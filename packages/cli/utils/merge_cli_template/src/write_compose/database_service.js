import { mongoImage } from "../../runtime.js";

export default ({ adminDatabase, databases, user, userPassword }) => {
  return {
    image: mongoImage,
    container_name: "mongodb",
    environment: {
      MONGODB_INITDB_DATABASE: `${adminDatabase}`,
      MONGODB_DATABASES: JSON.stringify(databases),
      MONGODB_USER: `${user}`,
      MONGODB_USER_PASSWORD: `${userPassword}`,
    },
    volumes: [
      "./mongodb-init.sh:/docker-entrypoint-initdb.d/mongodb-init.sh:ro",
    ],
    ports: ["27017:27017"],
  };
};
