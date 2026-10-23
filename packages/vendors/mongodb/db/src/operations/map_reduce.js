/** @deprecated Mongoose removed mapReduce. Use aggregate at the consumer boundary. */
export default async () => {
  throw new Error("MongoDB mapReduce is no longer supported. Use aggregate instead.");
};
