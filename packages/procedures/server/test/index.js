const { expect } = require("chai").use(require("sinon-chai"));
const { restore, replace, match, fake } = require("sinon");

const deps = require("../deps");
const server = require("../../server");

const port = "some-port";
const fn = "some-fn";

describe("Server", () => {
  beforeEach(() => {
    process.env.PORT = port;
  });
  afterEach(() => {
    restore();
  });

  it("should call post with the correct params", async () => {
    const useFake = fake();
    const listenFake = fake();
    const postFake = fake();
    const getFake = fake();
    const app = {
      use: useFake,
      get: getFake,
      listen: listenFake,
      post: postFake,
    };
    const expressFake = fake.returns(app);
    replace(deps, "express", expressFake);

    const asyncFn = "some-fn";
    const asyncHandlerFake = fake.returns(asyncFn);
    const expressMiddlewareFake = fake();

    replace(deps, "asyncHandler", asyncHandlerFake);
    replace(deps, "expressMiddleware", expressMiddlewareFake);

    const result = server().post(fn).listen();

    expect(result).to.equal(app);
    expect(getFake).to.have.been.calledWith(
      "/_sup",
      match((fn) => {
        const sendFake = fake();
        const nextFake = fake();
        fn(
          null,
          {
            send: sendFake,
          },
          nextFake
        );
        return sendFake.calledWith("nmjc") && nextFake.called;
      })
    );
    expect(asyncHandlerFake).to.have.been.calledWith(fn);
    expect(useFake).to.have.been.calledWith(deps.errorMiddleware);
    expect(listenFake).to.have.been.calledWith(port);
  });
  it("should call post and get with the correct params when chained", async () => {
    const useFake = fake();
    const listenFake = fake();
    const postFake = fake();
    const getFake = fake();
    const app = {
      use: useFake,
      listen: listenFake,
      post: postFake,
      get: getFake,
    };
    const expressFake = fake.returns(app);
    replace(deps, "express", expressFake);

    const asyncFn = "some-fn";
    const asyncHandlerFake = fake.returns(asyncFn);
    const expressMiddlewareFake = fake();

    replace(deps, "asyncHandler", asyncHandlerFake);
    replace(deps, "expressMiddleware", expressMiddlewareFake);

    const fn2 = "another-function";

    const result = server().post(fn).get(fn2).listen();

    expect(result).to.equal(app);
    expect(postFake).to.have.been.calledWith("/", asyncFn);
    expect(getFake).to.have.been.calledTwice;
    expect(getFake.getCall(0)).to.have.been.calledWith("/:id?", asyncFn);
    expect(getFake.getCall(1)).to.have.been.calledWith(
      "/_sup",
      match((fn) => {
        const sendFake = fake();
        const nextFake = fake();
        fn(
          null,
          {
            send: sendFake,
          },
          nextFake
        );
        return sendFake.calledWith("nmjc") && nextFake.called;
      })
    );
    expect(asyncHandlerFake).to.have.been.calledWith(fn);
    expect(useFake).to.have.been.calledWith(deps.errorMiddleware);
    expect(listenFake).to.have.been.calledWith(port);
  });
  it("should call post with the correct params and custom path and port", async () => {
    const useFake = fake();
    const listenFake = fake();
    const postFake = fake();
    const getFake = fake();
    const app = {
      use: useFake,
      listen: listenFake,
      post: postFake,
      get: getFake,
    };
    const expressFake = fake.returns(app);
    replace(deps, "express", expressFake);

    const newPath = "some-new-path";
    const newPort = "some-new-port";
    const asyncFn = "some-fn";
    const asyncHandlerFake = fake.returns(asyncFn);
    const expressMiddlewareFake = fake();

    replace(deps, "asyncHandler", asyncHandlerFake);
    replace(deps, "expressMiddleware", expressMiddlewareFake);

    const result = server()
      .post(fn, { path: newPath })
      .listen({ port: newPort });

    expect(result).to.equal(app);
    expect(postFake).to.have.been.calledWith(newPath, asyncFn);
    expect(getFake).to.have.been.calledWith(
      "/_sup",
      match((fn) => {
        const sendFake = fake();
        const nextFake = fake();
        fn(
          null,
          {
            send: sendFake,
          },
          nextFake
        );
        return sendFake.calledWith("nmjc") && nextFake.called;
      })
    );
    expect(asyncHandlerFake).to.have.been.calledWith(fn);
    expect(useFake).to.have.been.calledWith(deps.errorMiddleware);
    expect(listenFake).to.have.been.calledWith(newPort);
  });
  it("should call post with the correct params and default path and port", async () => {
    const useFake = fake();
    const listenFake = fake();
    const postFake = fake();
    const getFake = fake();
    const app = {
      use: useFake,
      listen: listenFake,
      post: postFake,
      get: getFake,
    };
    const expressFake = fake.returns(app);
    replace(deps, "express", expressFake);

    delete process.env.PORT;
    const asyncFn = "some-fn";
    const asyncHandlerFake = fake.returns(asyncFn);
    const expressMiddlewareFake = fake();

    replace(deps, "asyncHandler", asyncHandlerFake);
    replace(deps, "expressMiddleware", expressMiddlewareFake);

    const result = server().post(fn).listen();

    expect(result).to.equal(app);
    expect(postFake).to.have.been.calledWith("/", asyncFn);
    expect(getFake).to.have.been.calledWith(
      "/_sup",
      match((fn) => {
        const sendFake = fake();
        const nextFake = fake();
        fn(
          null,
          {
            send: sendFake,
          },
          nextFake
        );
        return sendFake.calledWith("nmjc") && nextFake.called;
      })
    );
    expect(asyncHandlerFake).to.have.been.calledWith(fn);
    expect(useFake).to.have.been.calledWith(deps.errorMiddleware);
    expect(listenFake).to.have.been.calledWith(3000);
  });
  it("should call post with the correct params with hooks", async () => {
    const useFake = fake();
    const listenFake = fake();
    const postFake = fake();
    const getFake = fake();
    const app = {
      use: useFake,
      listen: listenFake,
      post: postFake,
      get: getFake,
    };
    const expressFake = fake.returns(app);
    replace(deps, "express", expressFake);

    const asyncFn = "some-fn";
    const asyncHandlerFake = fake.returns(asyncFn);
    const expressMiddlewareFake = fake();

    replace(deps, "asyncHandler", asyncHandlerFake);
    replace(deps, "expressMiddleware", expressMiddlewareFake);

    const prehookFake = fake();
    const posthookFake = fake();

    const result = server({ prehook: prehookFake, posthook: posthookFake })
      .post(fn)
      .listen();

    expect(result).to.equal(app);
    expect(postFake).to.have.been.calledWith("/", asyncFn);
    expect(getFake).to.have.been.calledWith(
      "/_sup",
      match((fn) => {
        const sendFake = fake();
        const nextFake = fake();
        fn(
          null,
          {
            send: sendFake,
          },
          nextFake
        );
        return sendFake.calledWith("nmjc") && nextFake.called;
      })
    );
    expect(asyncHandlerFake).to.have.been.calledWith(fn);
    expect(useFake).to.have.been.calledWith(deps.errorMiddleware);
    expect(listenFake).to.have.been.calledWith(port);
  });
  it("should call post with the correct params with premiddleware", async () => {
    const useFake = fake();
    const listenFake = fake();
    const postFake = fake();
    const getFake = fake();
    const app = {
      use: useFake,
      listen: listenFake,
      post: postFake,
      get: getFake,
    };
    const expressFake = fake.returns(app);
    replace(deps, "express", expressFake);

    const asyncFn = "some-fn";
    const asyncHandlerFake = fake.returns(asyncFn);
    const expressMiddlewareFake = fake();

    replace(deps, "asyncHandler", asyncHandlerFake);
    replace(deps, "expressMiddleware", expressMiddlewareFake);

    const preMiddleware = "some-premiddleware";
    const postMiddleware = "some-postmiddleware";

    const result = server()
      .post(fn, {
        preMiddleware: [preMiddleware],
        postMiddleware: [postMiddleware],
      })
      .listen();

    expect(result).to.equal(app);
    expect(postFake).to.have.been.calledWith(
      "/",
      preMiddleware,
      asyncFn,
      postMiddleware
    );
    expect(getFake).to.have.been.calledWith(
      "/_sup",
      match((fn) => {
        const sendFake = fake();
        const nextFake = fake();
        fn(
          null,
          {
            send: sendFake,
          },
          nextFake
        );
        return sendFake.calledWith("nmjc") && nextFake.called;
      })
    );
    expect(asyncHandlerFake).to.have.been.calledWith(fn);
    expect(useFake).to.have.been.calledWith(deps.errorMiddleware);
    expect(listenFake).to.have.been.calledWith(port);
  });
  it("should call get with the correct params", async () => {
    const useFake = fake();
    const listenFake = fake();
    const getFake = fake();
    const app = {
      use: useFake,
      listen: listenFake,
      get: getFake,
    };
    const expressFake = fake.returns(app);
    replace(deps, "express", expressFake);

    const asyncFn = "some-fn";
    const asyncHandlerFake = fake.returns(asyncFn);
    const expressMiddlewareFake = fake();

    replace(deps, "asyncHandler", asyncHandlerFake);
    replace(deps, "expressMiddleware", expressMiddlewareFake);

    const result = server().get(fn).listen();

    expect(result).to.equal(app);
    expect(getFake.getCall(0)).to.have.been.calledWith("/:id?", asyncFn);
    expect(getFake.getCall(1)).to.have.been.calledWith(
      "/_sup",
      match((fn) => {
        const sendFake = fake();
        const nextFake = fake();
        fn(
          null,
          {
            send: sendFake,
          },
          nextFake
        );
        return sendFake.calledWith("nmjc") && nextFake.called;
      })
    );
    expect(asyncHandlerFake).to.have.been.calledWith(fn);
    expect(useFake).to.have.been.calledWith(deps.errorMiddleware);
    expect(listenFake).to.have.been.calledWith(port);
  });
  it("should call get with the correct params with premiddleware", async () => {
    const useFake = fake();
    const listenFake = fake();
    const getFake = fake();
    const app = {
      use: useFake,
      listen: listenFake,
      get: getFake,
    };
    const expressFake = fake.returns(app);
    replace(deps, "express", expressFake);

    const asyncFn = "some-fn";
    const asyncHandlerFake = fake.returns(asyncFn);
    const expressMiddlewareFake = fake();

    replace(deps, "asyncHandler", asyncHandlerFake);
    replace(deps, "expressMiddleware", expressMiddlewareFake);

    const preMiddleware = "some-premiddleware";
    const postMiddleware = "some-postmiddleware";

    const result = server()
      .get(fn, {
        preMiddleware: [preMiddleware],
        postMiddleware: [postMiddleware],
      })
      .listen();

    expect(result).to.equal(app);
    expect(getFake.getCall(0)).to.have.been.calledWith(
      "/:id?",
      preMiddleware,
      asyncFn,
      postMiddleware
    );
    expect(getFake.getCall(1)).to.have.been.calledWith(
      "/_sup",
      match((fn) => {
        const sendFake = fake();
        const nextFake = fake();
        fn(
          null,
          {
            send: sendFake,
          },
          nextFake
        );
        return sendFake.calledWith("nmjc") && nextFake.called;
      })
    );
    expect(asyncHandlerFake).to.have.been.calledWith(fn);
    expect(useFake).to.have.been.calledWith(deps.errorMiddleware);
    expect(listenFake).to.have.been.calledWith(port);
  });
  it("should call put with the correct params", async () => {
    const useFake = fake();
    const listenFake = fake();
    const putFake = fake();
    const getFake = fake();

    const app = {
      use: useFake,
      listen: listenFake,
      put: putFake,
      get: getFake,
    };
    const expressFake = fake.returns(app);
    replace(deps, "express", expressFake);

    const asyncFn = "some-fn";
    const asyncHandlerFake = fake.returns(asyncFn);
    const expressMiddlewareFake = fake();

    replace(deps, "asyncHandler", asyncHandlerFake);
    replace(deps, "expressMiddleware", expressMiddlewareFake);

    const preMiddleware = "some-premiddleware";
    const postMiddleware = "some-postmiddleware";

    const result = server()
      .put(fn, {
        preMiddleware: [preMiddleware],
        postMiddleware: [postMiddleware],
      })
      .listen();

    expect(result).to.equal(app);
    expect(putFake).to.have.been.calledWith(
      "/:id",
      preMiddleware,
      asyncFn,
      postMiddleware
    );
    expect(getFake).to.have.been.calledWith(
      "/_sup",
      match((fn) => {
        const sendFake = fake();
        const nextFake = fake();
        fn(
          null,
          {
            send: sendFake,
          },
          nextFake
        );
        return sendFake.calledWith("nmjc") && nextFake.called;
      })
    );
    expect(asyncHandlerFake).to.have.been.calledWith(fn);
    expect(useFake).to.have.been.calledWith(deps.errorMiddleware);
    expect(listenFake).to.have.been.calledWith(port);
  });
  it("should call delete with the correct params", async () => {
    const useFake = fake();
    const listenFake = fake();
    const deleteFake = fake();
    const getFake = fake();
    const app = {
      use: useFake,
      listen: listenFake,
      delete: deleteFake,
      get: getFake,
    };
    const expressFake = fake.returns(app);
    replace(deps, "express", expressFake);

    const asyncFn = "some-fn";
    const asyncHandlerFake = fake.returns(asyncFn);
    const expressMiddlewareFake = fake();

    replace(deps, "asyncHandler", asyncHandlerFake);
    replace(deps, "expressMiddleware", expressMiddlewareFake);

    const result = server().delete(fn).listen();

    expect(result).to.equal(app);
    expect(deleteFake).to.have.been.calledWith("/:id", asyncFn);
    expect(getFake).to.have.been.calledWith(
      "/_sup",
      match((fn) => {
        const sendFake = fake();
        const nextFake = fake();
        fn(
          null,
          {
            send: sendFake,
          },
          nextFake
        );
        return sendFake.calledWith("nmjc") && nextFake.called;
      })
    );
    expect(asyncHandlerFake).to.have.been.calledWith(fn);
    expect(useFake).to.have.been.calledWith(deps.errorMiddleware);
    expect(listenFake).to.have.been.calledWith(port);
  });
  it("should call delete with the correct params with premiddleware", async () => {
    const useFake = fake();
    const listenFake = fake();
    const deleteFake = fake();
    const getFake = fake();
    const app = {
      use: useFake,
      listen: listenFake,
      delete: deleteFake,
      get: getFake,
    };
    const expressFake = fake.returns(app);
    replace(deps, "express", expressFake);

    const asyncFn = "some-fn";
    const asyncHandlerFake = fake.returns(asyncFn);
    const expressMiddlewareFake = fake();

    replace(deps, "asyncHandler", asyncHandlerFake);
    replace(deps, "expressMiddleware", expressMiddlewareFake);

    const preMiddleware = "some-premiddleware";
    const postMiddleware = "some-postmiddleware";

    const result = server()
      .delete(fn, {
        preMiddleware: [preMiddleware],
        postMiddleware: [postMiddleware],
      })
      .listen();

    expect(result).to.equal(app);
    expect(deleteFake).to.have.been.calledWith(
      "/:id",
      preMiddleware,
      asyncFn,
      postMiddleware
    );
    expect(getFake).to.have.been.calledWith(
      "/_sup",
      match((fn) => {
        const sendFake = fake();
        const nextFake = fake();
        fn(
          null,
          {
            send: sendFake,
          },
          nextFake
        );
        return sendFake.calledWith("nmjc") && nextFake.called;
      })
    );
    expect(asyncHandlerFake).to.have.been.calledWith(fn);
    expect(useFake).to.have.been.calledWith(deps.errorMiddleware);
    expect(listenFake).to.have.been.calledWith(port);
  });
});
