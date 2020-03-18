const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake } = require("sinon");
const rolePermissions = require("..");

const roles = ["some-role"];

const permissionPriviledge = "some-permission-privildge";
const permissionDomain = "some-permission-domain";
const permissionService = "some-permission-service";

const permissions = [
  `${permissionService}:${permissionDomain}:${permissionPriviledge}`
];

const defaultRole = {
  "some-role": {
    permissions
  }
};
describe("Role permissions", () => {
  afterEach(() => {
    restore();
  });
  it("should return the correct roles with no custom roles", async () => {
    const result = await rolePermissions({
      roles,
      defaultRoles: { ...defaultRole }
    });
    expect(result).to.deep.equal([
      {
        service: permissionService,
        domain: permissionDomain,
        priviledge: permissionPriviledge
      }
    ]);
  });
  it("should return the correct roles with custom roles", async () => {
    const customRolePermissions = ["some-other-permission"];
    const customRolesPermissionsFnFake = fake.resolves(customRolePermissions);
    const customRole = "some-custom-role";
    const result = await rolePermissions({
      roles: [...roles, customRole],
      defaultRoles: { ...defaultRole },
      customRolePermissionsFn: customRolesPermissionsFnFake
    });
    expect(customRolesPermissionsFnFake).to.have.been.calledWith({
      roleId: customRole
    });
    expect(result).to.deep.equal([
      {
        service: permissionService,
        domain: permissionDomain,
        priviledge: permissionPriviledge
      },
      ...customRolePermissions
    ]);
  });
  it("should return the correct roles with multiple defaultRoles", async () => {
    const otherPermissionPriviledge = "some-other-permission-privildge";
    const otherPermissionDomain = "some-other-permission-domain";
    const otherPermissionService = "some-other-permission-service";

    const otherPermissions = [
      `${otherPermissionService}:${otherPermissionDomain}:${otherPermissionPriviledge}`
    ];

    const result = await rolePermissions({
      roles: [...roles, "some-other-role"],
      defaultRoles: {
        ...defaultRole,
        "some-other-role": {
          permissions: otherPermissions
        }
      }
    });
    expect(result).to.deep.equal([
      {
        service: permissionService,
        domain: permissionDomain,
        priviledge: permissionPriviledge
      },
      {
        service: otherPermissionService,
        domain: otherPermissionDomain,
        priviledge: otherPermissionPriviledge
      }
    ]);
  });
});
