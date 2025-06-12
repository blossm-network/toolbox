const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect } = chai;
const { restore, fake } = require("sinon");
const rolePermissions = require("..");

const network = "some-network";

const roles = [
  {
    id: "some-role-id",
    subject: {
      root: "some-role-root",
      domain: "some-role-domain",
      service: "some-role-service",
      network,
    },
  },
];

const permissionPriviledge = "some-permission-privildge";
const permissionDomain = "some-permission-domain";
const permissionService = "some-permission-service";

const permissions = [
  `${permissionService}:${permissionDomain}:${permissionPriviledge}`,
];

const defaultRole = {
  "some-role-id": {
    permissions,
  },
};

process.env.NETWORK = network;

describe("Role permissions", () => {
  afterEach(() => {
    restore();
  });
  it("should return the correct roles with no custom roles", async () => {
    const result = await rolePermissions({
      roles,
      defaultRoles: { ...defaultRole },
    });
    expect(result).to.deep.equal([
      {
        service: permissionService,
        domain: permissionDomain,
        privilege: permissionPriviledge,
      },
    ]);
  });
  it("should return the no roles with no custom roles and wrong context", async () => {
    const contextRoot = "some-context-root";
    const contextService = "some-context-service";
    const contextNetwork = "some-context-network";

    const result = await rolePermissions({
      roles,
      defaultRoles: { ...defaultRole },
      context: {
        root: contextRoot,
        service: contextService,
        network: contextNetwork,
      },
    });

    expect(result).to.deep.equal([]);
  });
  it("should return the correct roles with no custom roles and context", async () => {
    const contextRoot = "some-context-root";
    const contextService = "some-context-service";

    const result = await rolePermissions({
      roles: [
        ...roles.map((role) => {
          return {
            id: role.id,
            subject: {
              root: contextRoot,
              domain: "some-role-subject-domain",
              service: contextService,
              network,
            },
          };
        }),
      ],
      defaultRoles: { ...defaultRole },
      context: {
        root: contextRoot,
        service: contextService,
        network,
      },
    });

    expect(result).to.deep.equal([
      {
        service: permissionService,
        domain: permissionDomain,
        privilege: permissionPriviledge,
      },
    ]);
  });
  it("should return the correct roles with custom roles", async () => {
    const customRolePermissions = ["some-other-permission"];
    const customRolesPermissionsFnFake = fake.resolves(customRolePermissions);
    const customRole = {
      id: "some-custom-role-id",
      subject: {
        root: "some-custom-role-root",
        domain: "some-custom-role-domain",
        service: "some-custom-role-service",
        network,
      },
    };
    const result = await rolePermissions({
      roles: [...roles, customRole],
      defaultRoles: { ...defaultRole },
      customRolePermissionsFn: customRolesPermissionsFnFake,
    });
    expect(customRolesPermissionsFnFake).to.have.been.calledWith({
      roleId: "some-custom-role-id",
    });
    expect(result).to.deep.equal([
      {
        service: permissionService,
        domain: permissionDomain,
        privilege: permissionPriviledge,
      },
      ...customRolePermissions,
    ]);
  });
  it("should not return the custom role from other network", async () => {
    const customRolePermissions = ["some-other-permission"];
    const customRolesPermissionsFnFake = fake.resolves(customRolePermissions);
    const customRole = {
      id: "some-custom-role-id",
      subject: {
        root: "some-custom-role-root",
        domain: "some-custom-role-domain",
        service: "some-custom-role-service",
        network: "some-random-network",
      },
    };
    const result = await rolePermissions({
      roles: [...roles, customRole],
      defaultRoles: { ...defaultRole },
      customRolePermissionsFn: customRolesPermissionsFnFake,
    });
    expect(customRolesPermissionsFnFake).to.not.have.been.called;
    expect(result).to.deep.equal([
      {
        service: permissionService,
        domain: permissionDomain,
        privilege: permissionPriviledge,
      },
    ]);
  });
  it("should return the correct roles with multiple defaultRoles", async () => {
    const otherPermissionPriviledge = "some-other-permission-privildge";
    const otherPermissionDomain = "some-other-permission-domain";
    const otherPermissionService = "some-other-permission-service";

    const otherPermissions = [
      `${otherPermissionService}:${otherPermissionDomain}:${otherPermissionPriviledge}`,
    ];

    const result = await rolePermissions({
      roles: [...roles, { id: "some-other-role-id", subject: { network } }],
      defaultRoles: {
        ...defaultRole,
        "some-other-role-id": {
          permissions: otherPermissions,
        },
      },
    });
    expect(result).to.deep.equal([
      {
        service: permissionService,
        domain: permissionDomain,
        privilege: permissionPriviledge,
      },
      {
        service: otherPermissionService,
        domain: otherPermissionDomain,
        privilege: otherPermissionPriviledge,
      },
    ]);
  });
});
