export default (Client) => {
  let client;
  const getClient = () => (client ||= new Client());
  const methods = new WeakMap();

  return new Proxy(Object.create(Client.prototype), {
    get(_, key) {
      const instance = getClient();
      const value = Reflect.get(instance, key);
      if (typeof value !== "function") return value;
      if (!methods.has(value)) methods.set(value, value.bind(instance));
      return methods.get(value);
    },
    set(_, key, value) {
      return Reflect.set(getClient(), key, value);
    },
    defineProperty(_, key, descriptor) {
      return Reflect.defineProperty(getClient(), key, descriptor);
    },
    deleteProperty(_, key) {
      return Reflect.deleteProperty(getClient(), key);
    },
    getOwnPropertyDescriptor(_, key) {
      const descriptor = Reflect.getOwnPropertyDescriptor(getClient(), key);
      return descriptor && { ...descriptor, configurable: true };
    },
    ownKeys() {
      return Reflect.ownKeys(getClient());
    },
    has(_, key) {
      return key in getClient();
    },
  });
};
