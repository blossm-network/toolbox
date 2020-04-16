const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake } = require("sinon");
const rolePermissions = require("..");

const roles = [
  {
    id: "some-role-id",
    root: "some-role-root",
    service: "some-role-service",
    network: "some-role-network",
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
    const contextNetwork = "some-context-network";

    const result = await rolePermissions({
      roles: [
        ...roles.map((role) => {
          return {
            id: role.id,
            root: contextRoot,
            service: contextService,
            network: contextNetwork,
          };
        }),
      ],
      defaultRoles: { ...defaultRole },
      context: {
        root: contextRoot,
        service: contextService,
        network: contextNetwork,
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
      root: "some-custom-role-root",
      service: "some-custom-role-service",
      network: "some-custom-role-network",
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
  it("should return the correct roles with multiple defaultRoles", async () => {
    const otherPermissionPriviledge = "some-other-permission-privildge";
    const otherPermissionDomain = "some-other-permission-domain";
    const otherPermissionService = "some-other-permission-service";

    const otherPermissions = [
      `${otherPermissionService}:${otherPermissionDomain}:${otherPermissionPriviledge}`,
    ];

    const result = await rolePermissions({
      roles: [...roles, { id: "some-other-role-id" }],
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
