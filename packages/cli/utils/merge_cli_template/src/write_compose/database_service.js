module.exports = {
  image: "mongo:latest",
  container_name: "mongodb",
  environment: {
    MONGODB_INITDB_ROOT_USERNAME: "${MONGODB_ADMIN_USER}",
    MONGODB_INITDB_ROOT_PASSWORD: "${MONGODB_ADMIN_USER_PASSWORD}",
    MONGODB_INITDB_DATABASE: "${MONGODB_ADMIN_DATABASE}",
    MONGODB_DATABASE: "${MONGODB_DATABASE}",
    MONGODB_USER: "${MONGODB_USER}",
    MONGODB_USER_PASSWORD: "${MONGODB_USER_PASSWORD}"
  },
  volumes: [
    "./mongodb-init.sh:/docker-entrypoint-initdb.d/mongodb-init.sh:ro",
    "db-data:/data/db"
  ],
  ports: ["27017:27017"]
};
