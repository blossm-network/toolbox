import * as chai from "chai";
import sinonChai from "sinon-chai";
import { restore, replace, fake, stub } from "sinon";

import get from "../index.js";
import deps from "../deps.js";

chai.use(sinonChai);
const { expect } = chai;

const obj = { a: "some-obj" };
const sort = { a: "1" };

const count = "some-count";
const txId0 = "some-tx-id0";
const txId1 = "some-tx-id1";
const txId2 = "some-tx-id2";
const id = "some-id";
const created = "some-created";
const modified = "some-modified";
const foundContext = "some-found-context";

const envContext = "some-env-context";
const envContextRoot = "some-env-context-root";
const envContextService = "some-env-context-service";
const envContextNetwork = "some-env-context-network";

const envName = "some-env-name";
const envNetwork = "some-env-network";
const coreNetwork = "some-base-network";

const nextUrl = "some-next-url";

const context = {
  [envContext]: {
    root: envContextRoot,
    service: envContextService,
    network: envContextNetwork,
  },
};

process.env.NAME = envName;
process.env.NETWORK = envNetwork;
process.env.CORE_NETWORK = coreNetwork;

describe("View store get", () => {
  beforeEach(() => {
    process.env.CONTEXT = envContext;
  });
  afterEach(() => {
    restore();
  });

  it("should call with the correct params", async () => {
    const results = [];
    const formattedResults = [];

    const formatFake = stub();
    for (let i = 0; i < 50; i++) {
      results.push({
        body: obj,
        headers: { id, created, modified, context: foundContext },
        trace: {
          "some-service": { "some-domain": [txId0] },
          "some-other-service": { "some-other-domain": [txId1] },
          "amother-service": { "another-domain": [txId2] },
        },
      });
      const formattedResult = { i: "something" };
      formattedResults.push(formattedResult);
      formatFake.onCall(i).returns(formattedResult);
    }
    const findFake = fake.returns(results);
    const countFake = fake.returns(200);

    const query = {
      "some-query-key": { a: "b" },
      "some-other-query-key": "#2",
      "another-query-key": "@2020-12-09T02:50:59.076Z",
      "even-another-query-key": { 0: "some-0", 1: "some-1" },
    };

    const urlEncodeQueryDataFake = fake.returns(nextUrl);
    replace(deps, "urlEncodeQueryData", urlEncodeQueryDataFake);

    const req = {
      query: {
        sort,
        context,
        query,
      },
      params: {
        id,
      },
    };

    const sendFake = fake();
    const res = {
      send: sendFake,
    };
    await get({ findFn: findFake, countFn: countFake, formatFn: formatFake })(
      req,
      res
    );
    expect(findFake).to.have.been.calledWith({
      limit: 50,
      skip: 0,
      sort: { "body.a": 1 },
      query: {
        "body.some-query-key": { a: "b" },
        "body.some-other-query-key": 2,
        "body.another-query-key": new Date("2020-12-09T02:50:59.076Z"),
        "body.even-another-query-key": ["some-0", "some-1"],
        "headers.id": id,
        "headers.context": {
          root: envContextRoot,
          domain: "some-env-context",
          service: envContextService,
          network: envContextNetwork,
        },
      },
    });
    expect(countFake).to.have.been.calledWith({
      query: {
        "body.some-query-key": { a: "b" },
        "body.some-other-query-key": 2,
        "body.another-query-key": new Date("2020-12-09T02:50:59.076Z"),
        "body.even-another-query-key": ["some-0", "some-1"],
        "headers.id": id,
        "headers.context": {
          root: envContextRoot,
          domain: "some-env-context",
          service: envContextService,
          network: envContextNetwork,
        },
      },
    });
    expect(urlEncodeQueryDataFake).to.have.been.calledWith(
      `https://v.${envContext}.${envNetwork}/${envName}`,
      {
        sort: { a: "1" },
        query,
        skip: 50,
        limit: 50,
      }
    );
    for (let i = 0; i < results.length; i++) {
      expect(formatFake.getCall(i)).to.have.been.calledWith({
        body: results[i].body,
        id: results[i].headers.id,
        created,
        modified,
      });
    }
    expect(sendFake).to.have.been.calledWith({
      content: formattedResults.map((r) => ({
        ...r,
        headers: {
          id,
          context: foundContext,
          trace: [txId0, txId1, txId2],
        },
      })),
      updates:
        "https://updates.some-base-network/channel?name=some-env-name&context=some-env-context&network=some-env-network",
      next: nextUrl,
      count: 200,
    });
  });
  it("should call with the correct params exporting to csv", async () => {
    const results = [];
    const formattedResults = [];

    const formatFake = stub();
    for (let i = 0; i < 50; i++) {
      results.push({
        body: obj,
        headers: { id, created, modified, context: foundContext },
        trace: {
          "some-service": { "some-domain": [txId0] },
          "some-other-service": { "some-other-domain": [txId1] },
          "amother-service": { "another-domain": [txId2] },
        },
      });
      const formattedResult = { i: "something" };
      formattedResults.push(formattedResult);
      formatFake.onCall(i).returns(formattedResult);
    }
    const findFake = fake.returns(results);
    const countFake = fake.returns(200);

    const query = { "some-query-key": 1 };

    const urlEncodeQueryDataFake = fake.returns(nextUrl);
    replace(deps, "urlEncodeQueryData", urlEncodeQueryDataFake);

    const req = {
      query: {
        sort,
        context,
        query,
        download: "csv",
      },
      params: {
        id,
      },
    };

    const writeHeadFake = fake();
    const endFake = fake();
    const res = {
      writeHead: writeHeadFake,
      end: endFake,
    };
    const csvData = { some: "csv-data" };
    const csvField = "some-field";

    const formatCsvFn = fake.returns(csvData);
    const fieldsFn = fake.returns([csvField]);

    const formatCsv = {
      fieldsFn,
      fn: formatCsvFn,
    };

    const csvResult = "some-csv-result";
    const jsonToCsvFake = fake.returns(csvResult);
    replace(deps, "jsonToCsv", jsonToCsvFake);

    await get({
      formatCsv,
      findFn: findFake,
      countFn: countFake,
      formatFn: formatFake,
    })(req, res);

    expect(findFake).to.have.been.calledWith({
      limit: 50,
      skip: 0,
      sort: { "body.a": 1 },
      query: {
        "body.some-query-key": 1,
        "headers.id": id,
        "headers.context": {
          root: envContextRoot,
          domain: "some-env-context",
          service: envContextService,
          network: envContextNetwork,
        },
      },
    });
    expect(countFake).to.have.been.calledWith({
      query: {
        "body.some-query-key": 1,
        "headers.id": id,
        "headers.context": {
          root: envContextRoot,
          domain: "some-env-context",
          service: envContextService,
          network: envContextNetwork,
        },
      },
    });
    expect(jsonToCsvFake).to.have.been.calledWith({
      data: results.map((result) => ({
        id: result.headers.id,
        some: "csv-data",
      })),
      fields: ["some-field", "id"],
    });
    expect(fieldsFn).to.have.been.calledWith(results.map((r) => r.body));

    for (let i = 0; i < results.length; i++) {
      expect(formatCsvFn.getCall(i)).to.have.been.calledWith(results[i].body);
    }
    expect(writeHeadFake).to.have.been.calledWith(200, {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment",
    });
    expect(endFake).to.have.been.calledWith(csvResult);
  });
  it("should call with the correct params with no env context, group as true, text in query, update keys", async () => {
    const results = [];
    const formattedResults = [];

    const formatFake = stub();
    for (let i = 0; i < 50; i++) {
      results.push({
        body: {
          ...obj,
          "some-other-query-key": { a: { b: 2 } },
        },
        headers: { id, created, modified, context: foundContext },
        trace: {
          "some-service": { "some-domain": [txId0] },
          "some-other-service": { "some-other-domain": [txId1] },
          "amother-service": { "another-domain": [txId2] },
        },
      });
      const formattedResult = { i: "something" };
      formattedResults.push(formattedResult);
      formatFake.onCall(i).returns(formattedResult);
    }
    const findFake = fake.returns(results);
    const countFake = fake.returns(200);

    const query = {
      "some-query-key": 1,
      "another-query-key": 3,
    };

    const urlEncodeQueryDataFake = fake.returns(nextUrl);
    replace(deps, "urlEncodeQueryData", urlEncodeQueryDataFake);

    const token = "some-token";
    const text = "some-text";
    const req = {
      query: {
        sort,
        context: {
          ...context,
          principal: {
            root: "some-context-principal-root",
          },
        },
        query: {
          ...query,
          "some-other-query-key.a.b": "something",
        },
        token,
        text,
      },
      params: {
        id,
      },
    };

    const sendFake = fake();
    const res = {
      send: sendFake,
    };
    delete process.env.CONTEXT;
    const groups = "some-groups";
    const groupsLookupFnFake = fake.returns(groups);
    await get({
      findFn: findFake,
      countFn: countFake,
      formatFn: formatFake,
      group: true,
      groupsLookupFn: groupsLookupFnFake,
      updateKeys: ["some-other-query-key.a.b"],
    })(req, res);

    expect(findFake).to.have.been.calledWith({
      limit: 50,
      skip: 0,
      sort: { "body.a": 1 },
      text,
      query: {
        "body.some-query-key": 1,
        "body.another-query-key": 3,
        "body.some-other-query-key.a.b": "something",
        "headers.id": id,
        "headers.groups": {
          $elemMatch: {
            $in: groups,
          },
        },
      },
    });
    expect(countFake).to.have.been.calledWith({
      text,
      query: {
        "body.some-query-key": 1,
        "body.another-query-key": 3,
        "body.some-other-query-key.a.b": "something",
        "headers.id": id,
        "headers.groups": {
          $elemMatch: {
            $in: groups,
          },
        },
      },
    });
    expect(groupsLookupFnFake).to.have.been.calledWith({
      token,
    });
    expect(urlEncodeQueryDataFake).to.have.been.calledWith(
      `https://v.${envNetwork}/${envName}`,
      {
        sort: { a: "1" },
        query: {
          ...query,
          "some-other-query-key.a.b": "something",
        },
        skip: 50,
        limit: 50,
      }
    );
    for (let i = 0; i < results.length; i++) {
      expect(formatFake.getCall(i)).to.have.been.calledWith({
        body: results[i].body,
        id: results[i].headers.id,
        created,
        modified,
      });
    }
    expect(sendFake).to.have.been.calledWith({
      content: formattedResults.map((r) => ({
        ...r,
        headers: {
          id,
          context: foundContext,
          trace: [txId0, txId1, txId2],
        },
      })),
      updates:
        "https://updates.some-base-network/channel?name=some-env-name&network=some-env-network&key=2&principal=some-context-principal-root",
      next: nextUrl,
      count: 200,
    });
  });
  it("should call with the correct params with emptyFn", async () => {
    const findFake = fake.returns([]);
    const countFake = fake.returns(200);

    const query = { "some-query-key": 1 };

    const urlEncodeQueryDataFake = fake.returns(nextUrl);
    replace(deps, "urlEncodeQueryData", urlEncodeQueryDataFake);

    const req = {
      query: {
        sort,
        context,
        query,
      },
      params: {
        id,
      },
    };

    const sendFake = fake();
    const res = {
      send: sendFake,
    };

    const someEmptyFnResponse = "some-empty-fn-response";
    const emptyFnFake = fake.returns(someEmptyFnResponse);

    await get({
      findFn: findFake,
      countFn: countFake,
      emptyFn: emptyFnFake,
    })(req, res);

    expect(findFake).to.have.been.calledWith({
      limit: 50,
      skip: 0,
      sort: { "body.a": 1 },
      query: {
        "body.some-query-key": 1,
        "headers.id": id,
        "headers.context": {
          root: envContextRoot,
          domain: "some-env-context",
          service: envContextService,
          network: envContextNetwork,
        },
      },
    });
    expect(countFake).to.have.been.calledWith({
      query: {
        "body.some-query-key": 1,
        "headers.id": id,
        "headers.context": {
          root: envContextRoot,
          domain: "some-env-context",
          service: envContextService,
          network: envContextNetwork,
        },
      },
    });
    expect(urlEncodeQueryDataFake).to.not.have.been.called;
    expect(emptyFnFake).to.have.been.calledWith(query);
    expect(sendFake).to.have.been.calledWith({
      content: someEmptyFnResponse,
      updates:
        "https://updates.some-base-network/channel?name=some-env-name&context=some-env-context&network=some-env-network",
      count: 200,
    });
  });
  it("should call with the correct params if limit reached", async () => {
    const findFake = fake.returns([
      {
        body: obj,
        headers: { id, created, modified, context: foundContext },
        trace: {
          "some-service": { "some-domain": [txId0] },
          "some-other-service": { "some-other-domain": [txId1] },
          "amother-service": { "another-domain": [txId2] },
        },
      },
    ]);
    const formattedResult = { formatted: "result " };
    const formatFake = fake.returns(formattedResult);
    const countFake = fake.returns(3);

    const query = { "some-query-key": 1 };

    const urlEncodeQueryDataFake = fake.returns(nextUrl);
    replace(deps, "urlEncodeQueryData", urlEncodeQueryDataFake);

    const skip = "1";
    const limit = "1";

    const req = {
      query: {
        sort,
        context,
        query,
        skip,
        limit,
      },
      params: {},
    };

    const sendFake = fake();
    const res = {
      send: sendFake,
    };
    await get({ findFn: findFake, countFn: countFake, formatFn: formatFake })(
      req,
      res
    );
    expect(findFake).to.have.been.calledWith({
      limit: 1,
      skip: 1,
      sort: { "body.a": 1 },
      query: {
        "body.some-query-key": 1,
        "headers.context": {
          root: envContextRoot,
          domain: "some-env-context",
          service: envContextService,
          network: envContextNetwork,
        },
      },
    });
    expect(countFake).to.have.been.calledWith({
      query: {
        "body.some-query-key": 1,
        "headers.context": {
          root: envContextRoot,
          domain: "some-env-context",
          service: envContextService,
          network: envContextNetwork,
        },
      },
    });
    expect(urlEncodeQueryDataFake).to.have.been.calledWith(
      `https://v.${envContext}.${envNetwork}/${envName}`,
      {
        sort: { a: "1" },
        query,
        skip: 2,
        limit: 1,
      }
    );
    expect(formatFake.getCall(0)).to.have.been.calledWith({
      body: obj,
      id,
      created,
      modified,
    });
    expect(formatFake).to.have.been.calledOnce;
    expect(sendFake).to.have.been.calledWith({
      content: [
        {
          ...formattedResult,
          headers: {
            id,
            context: foundContext,
            trace: [txId0, txId1, txId2],
          },
        },
      ],
      updates:
        "https://updates.some-base-network/channel?name=some-env-name&context=some-env-context&network=some-env-network",
      next: nextUrl,
      count: 3,
    });
  });
  it("should call with the correct params if all objects already retrieved with skip and limit, duplicate txId", async () => {
    const findFake = fake.returns([
      {
        body: obj,
        headers: { id, created, modified, context: foundContext },
        trace: {
          "some-service": { "some-domain": [txId0] },
          "some-other-service": { "some-other-domain": [txId1] },
          "amother-service": { "another-domain": [txId0] },
        },
      },
    ]);
    const formattedResult = { some: "result" };
    const formatFake = fake.returns(formattedResult);
    const countFake = fake.returns(1);

    const query = { "some-query-key": 1 };

    const urlEncodeQueryDataFake = fake.returns(nextUrl);
    replace(deps, "urlEncodeQueryData", urlEncodeQueryDataFake);

    const skip = "0";
    const limit = "1";

    const req = {
      query: {
        sort,
        context,
        query,
        skip,
        limit,
      },
      params: {},
    };

    const sendFake = fake();
    const res = {
      send: sendFake,
    };
    await get({ findFn: findFake, countFn: countFake, formatFn: formatFake })(
      req,
      res
    );
    expect(findFake).to.have.been.calledWith({
      limit: 1,
      skip: 0,
      sort: { "body.a": 1 },
      query: {
        "body.some-query-key": 1,
        "headers.context": {
          root: envContextRoot,
          domain: "some-env-context",
          service: envContextService,
          network: envContextNetwork,
        },
      },
    });
    expect(countFake).to.have.been.calledWith({
      query: {
        "body.some-query-key": 1,
        "headers.context": {
          root: envContextRoot,
          domain: "some-env-context",
          service: envContextService,
          network: envContextNetwork,
        },
      },
    });
    expect(urlEncodeQueryDataFake).to.not.have.been.called;
    expect(formatFake.getCall(0)).to.have.been.calledWith({
      body: obj,
      id,
      created,
      modified,
    });
    expect(formatFake).to.have.been.calledOnce;
    expect(sendFake).to.have.been.calledWith({
      content: [
        {
          ...formattedResult,
          headers: {
            id,
            context: foundContext,
            trace: [txId0, txId1],
          },
        },
      ],
      updates:
        "https://updates.some-base-network/channel?name=some-env-name&context=some-env-context&network=some-env-network",
      count: 1,
    });
  });
  it("should call with the correct params with no query and txId in headers", async () => {
    const findFake = fake.returns([
      {
        body: obj,
        headers: {
          id,
          created,
          modified,
          context: foundContext,
        },
        trace: {
          "some-service": { "some-domain": [txId0] },
          "some-other-service": { "some-other-domain": [txId1] },
          "amother-service": { "another-domain": [txId2] },
        },
      },
    ]);
    const formattedResult = { some: "result" };
    const formatFake = fake.returns(formattedResult);
    const countFake = fake.returns(count);

    const urlEncodeQueryDataFake = fake.returns(nextUrl);
    replace(deps, "urlEncodeQueryData", urlEncodeQueryDataFake);

    const req = {
      query: {
        context,
      },
      params: {},
    };

    const sendFake = fake();
    const res = {
      send: sendFake,
    };
    await get({ findFn: findFake, countFn: countFake, formatFn: formatFake })(
      req,
      res
    );
    expect(findFake).to.have.been.calledWith({
      limit: 50,
      skip: 0,
      query: {
        "headers.context": {
          root: envContextRoot,
          domain: "some-env-context",
          service: envContextService,
          network: envContextNetwork,
        },
      },
    });
    expect(countFake).to.have.been.calledWith({
      query: {
        "headers.context": {
          root: envContextRoot,
          domain: "some-env-context",
          service: envContextService,
          network: envContextNetwork,
        },
      },
    });
    expect(urlEncodeQueryDataFake).to.not.have.been.called;
    expect(formatFake.getCall(0)).to.have.been.calledWith({
      body: obj,
      id,
      created,
      modified,
    });
    expect(formatFake).to.have.been.calledOnce;
    expect(sendFake).to.have.been.calledWith({
      content: [
        {
          ...formattedResult,
          headers: { trace: [txId0, txId1, txId2], id, context: foundContext },
        },
      ],
      updates:
        "https://updates.some-base-network/channel?name=some-env-name&context=some-env-context&network=some-env-network",
      count,
    });
  });
  it("should call with the correct params with no params, one as true", async () => {
    const findFake = fake.returns([
      {
        body: obj,
        headers: { id, created, modified, context: foundContext },
        trace: {
          "some-service": { "some-domain": [txId0] },
          "some-other-service": { "some-other-domain": [txId1] },
          "amother-service": { "another-domain": [txId2] },
        },
      },
    ]);
    const formattedResult = { formatted: "result" };
    const formatFake = fake.returns(formattedResult);
    const countFake = fake.returns(count);

    const query = { "some-query-key": 1 };

    const urlEncodeQueryDataFake = fake.returns(nextUrl);
    replace(deps, "urlEncodeQueryData", urlEncodeQueryDataFake);

    const req = {
      query: {
        sort,
        context,
        query,
      },
      params: {},
    };

    const sendFake = fake();
    const res = {
      send: sendFake,
    };

    const otherQuery = { "some-other-query-key": 1 };
    const otherSort = { "some-other-sort-key": 1 };
    const queryFnFake = fake.returns(otherQuery);
    const sortFnFake = fake.returns(otherSort);
    delete process.env.DOMAIN;
    await get({
      findFn: findFake,
      countFn: countFake,
      one: true,
      queryFn: queryFnFake,
      sortFn: sortFnFake,
      formatFn: formatFake,
    })(req, res);
    expect(queryFnFake).to.have.been.calledWith(query);
    expect(sortFnFake).to.have.been.calledWith(sort);
    expect(findFake).to.have.been.calledWith({
      limit: 1,
      skip: 0,
      sort: { "body.some-other-sort-key": 1 },
      query: {
        "body.some-other-query-key": 1,
        "headers.context": {
          root: envContextRoot,
          domain: "some-env-context",
          service: envContextService,
          network: envContextNetwork,
        },
      },
    });
    expect(countFake).to.not.have.been.called;
    expect(formatFake).to.have.been.calledWith({
      body: obj,
      id,
      created,
      modified,
    });
    expect(sendFake).to.have.been.calledWith({
      content: {
        ...formattedResult,
        headers: { trace: [txId0, txId1, txId2], id, context: foundContext },
      },
      updates:
        "https://updates.some-base-network/channel?name=some-env-name&context=some-env-context&network=some-env-network",
    });
  });
  it("should call with the correct params with bootstrap as true", async () => {
    const findFake = fake.returns([
      {
        body: obj,
        headers: { id, created, modified, context: foundContext },
        trace: {
          "some-service": { "some-domain": [txId0] },
          "some-other-service": { "some-other-domain": [txId1] },
          "amother-service": { "another-domain": [txId2] },
        },
      },
    ]);
    const formattedResult = { formatted: "result" };
    const formatFake = fake.returns(formattedResult);
    const countFake = fake.returns(count);

    const query = { "some-query-key": 1 };

    const urlEncodeQueryDataFake = fake.returns(nextUrl);
    replace(deps, "urlEncodeQueryData", urlEncodeQueryDataFake);

    const bootstrapContext = "some-bootstrap-context";
    const bootstrapRoot = "some-bootstrap-root";
    const req = {
      query: {
        sort,
        context: {
          ...context,
          [bootstrapContext]: {
            root: bootstrapRoot,
          },
        },
        query,
        bootstrap: true,
      },
      params: {},
    };

    const sendFake = fake();
    const res = {
      send: sendFake,
    };

    const otherQuery = { "some-other-query-key": 1 };
    const queryFnFake = fake.returns(otherQuery);
    delete process.env.DOMAIN;
    process.env.BOOTSTRAP_CONTEXT = bootstrapContext;
    await get({
      findFn: findFake,
      countFn: countFake,
      queryFn: queryFnFake,
      formatFn: formatFake,
    })(req, res);
    expect(queryFnFake).to.have.been.calledWith(query);
    expect(findFake).to.have.been.calledWith({
      limit: 1,
      skip: 0,
      query: {
        "headers.id": bootstrapRoot,
        "headers.context": {
          root: envContextRoot,
          domain: "some-env-context",
          service: envContextService,
          network: envContextNetwork,
        },
      },
    });
    expect(countFake).to.not.have.been.called;
    expect(formatFake).to.have.been.calledWith({
      body: obj,
      id,
      created,
      modified,
    });
    expect(sendFake).to.have.been.calledWith({
      content: {
        ...formattedResult,
        headers: { trace: [txId0, txId1, txId2], id, context: foundContext },
      },
      updates:
        "https://updates.some-base-network/channel?name=some-env-name&context=some-env-context&network=some-env-network",
    });
  });
  it("should call with the correct params with bootstrap as true, ignoring a call to group", async () => {
    const findFake = fake.returns([
      {
        body: obj,
        headers: { id, created, modified, context: foundContext },
        trace: {
          "some-service": { "some-domain": [txId0] },
          "some-other-service": { "some-other-domain": [txId1] },
          "amother-service": { "another-domain": [txId2] },
        },
      },
    ]);
    const formattedResult = { formatted: "result" };
    const formatFake = fake.returns(formattedResult);
    const countFake = fake.returns(count);

    const query = { "some-query-key": 1 };

    const urlEncodeQueryDataFake = fake.returns(nextUrl);
    replace(deps, "urlEncodeQueryData", urlEncodeQueryDataFake);

    const bootstrapContext = "some-bootstrap-context";
    const bootstrapRoot = "some-bootstrap-root";
    const req = {
      query: {
        sort,
        context: {
          ...context,
          [bootstrapContext]: {
            root: bootstrapRoot,
          },
        },
        query,
        bootstrap: true,
      },
      params: {},
    };

    const sendFake = fake();
    const res = {
      send: sendFake,
    };

    const otherQuery = { "some-other-query-key": 1 };
    const queryFnFake = fake.returns(otherQuery);
    delete process.env.DOMAIN;
    process.env.BOOTSTRAP_CONTEXT = bootstrapContext;
    const groupsLookupFnFake = fake();
    await get({
      findFn: findFake,
      countFn: countFake,
      queryFn: queryFnFake,
      formatFn: formatFake,
      groupsLookupFn: groupsLookupFnFake,
      group: true,
    })(req, res);
    expect(groupsLookupFnFake).to.not.have.been.called;
    expect(queryFnFake).to.have.been.calledWith(query);
    expect(findFake).to.have.been.calledWith({
      limit: 1,
      skip: 0,
      query: {
        "headers.id": bootstrapRoot,
        "headers.context": {
          root: envContextRoot,
          domain: "some-env-context",
          service: envContextService,
          network: envContextNetwork,
        },
      },
    });
    expect(countFake).to.not.have.been.called;
    expect(formatFake).to.have.been.calledWith({
      body: obj,
      id,
      created,
      modified,
    });
    expect(sendFake).to.have.been.calledWith({
      content: {
        ...formattedResult,
        headers: { trace: [txId0, txId1, txId2], id, context: foundContext },
      },
      updates:
        "https://updates.some-base-network/channel?name=some-env-name&context=some-env-context&network=some-env-network",
    });
  });
  it("should throw with bootstrap as true without env variable", async () => {
    const findFake = fake.returns([
      {
        body: obj,
        headers: { id, context: foundContext },
        trace: {
          "some-service": { "some-domain": [txId0] },
          "some-other-service": { "some-other-domain": [txId1] },
          "amother-service": { "another-domain": [txId2] },
        },
      },
    ]);
    const formattedResult = { formatted: "result" };
    const formatFake = fake.returns(formattedResult);
    const countFake = fake.returns(count);

    const query = { "some-query-key": 1 };

    const urlEncodeQueryDataFake = fake.returns(nextUrl);
    replace(deps, "urlEncodeQueryData", urlEncodeQueryDataFake);

    const bootstrapContext = "some-bootstrap-context";
    const bootstrapRoot = "some-bootstrap-root";
    const req = {
      query: {
        sort,
        context: {
          ...context,
          [bootstrapContext]: {
            root: bootstrapRoot,
          },
        },
        query,
        bootstrap: true,
      },
      params: {},
    };

    const sendFake = fake();
    const res = {
      send: sendFake,
    };

    const otherQuery = { "some-other-query-key": 1 };
    const queryFnFake = fake.returns(otherQuery);
    delete process.env.DOMAIN;
    delete process.env.BOOTSTRAP_CONTEXT;

    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "forbiddenError", {
      message: messageFake,
    });

    try {
      process.env.BOOTSTRAP_CONTEXT = "something";
      await get({
        findFn: findFake,
        countFn: countFake,
        queryFn: queryFnFake,
        formatFn: formatFake,
      })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "There isn't a context to bootstrap."
      );
      expect(e).to.equal(error);
    }
  });
  it("should throw correctly if bootstrap forbidden", async () => {
    const findFake = fake.returns([]);
    const countFake = fake.returns(0);

    const req = {
      query: {
        context: {
          [envContext]: {},
        },
        bootstrap: true,
      },
      params: {},
    };

    const sendFake = fake();
    const res = {
      send: sendFake,
    };

    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "forbiddenError", {
      message: messageFake,
    });

    try {
      process.env.BOOTSTRAP_CONTEXT = "something";
      await get({ findFn: findFake, countFn: countFake })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "There isn't a context to bootstrap."
      );
      expect(e).to.equal(error);
    }
  });
  it("should throw correctly if context forbidden", async () => {
    const findFake = fake.returns([]);
    const countFake = fake.returns(0);

    const req = {
      query: {
        context: {},
        bootstrap: true,
      },
      params: {},
    };

    const sendFake = fake();
    const res = {
      send: sendFake,
    };

    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "forbiddenError", {
      message: messageFake,
    });

    try {
      process.env.CONTEXT = "something-other-context";
      await get({ findFn: findFake, countFn: countFake })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "This context is forbidden.",
        {
          info: {
            context: {},
          },
        }
      );
      expect(e).to.equal(error);
    }
  });
  it("should throw correctly if cant group", async () => {
    const req = {
      query: {
        context: {
          [envContext]: {},
        },
      },
      params: {},
    };

    const sendFake = fake();
    const res = {
      send: sendFake,
    };

    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "forbiddenError", {
      message: messageFake,
    });

    try {
      await get({ group: true })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith(
        "This request is missing a context."
      );
      expect(e).to.equal(error);
    }
  });
  it("should throw correctly if not found", async () => {
    const findFake = fake.returns([]);
    const countFake = fake.returns(0);

    const req = {
      query: {
        context,
      },
      params: {},
    };

    const sendFake = fake();
    const res = {
      send: sendFake,
    };

    const error = "some-error";
    const messageFake = fake.returns(error);
    replace(deps, "resourceNotFoundError", {
      message: messageFake,
    });

    try {
      await get({ findFn: findFake, countFn: countFake, one: true })(req, res);
      //shouldn't get called
      expect(2).to.equal(1);
    } catch (e) {
      expect(messageFake).to.have.been.calledWith("This view wasn't found.");
      expect(e).to.equal(error);
    }
  });
});
