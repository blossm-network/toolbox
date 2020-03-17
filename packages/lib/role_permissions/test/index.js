const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake } = require("sinon");
const rolePermissions = require("..");

const roles = ["some-role"];
const priviledges = ["some-priviledges"];

const domain = "some-domain";
const service = "some-service";

const defaultRoles = {
  domain,
  service,
  roles: {
    "some-role": {
      priviledges
    }
  }
};
describe("Role permissions", () => {
  afterEach(() => {
    restore();
  });
  it("should return the correct roles with no custom roles", async () => {
    const result = await rolePermissions({
      roles,
      defaultRoles
    });
    expect(result).to.deep.equal(
      priviledges.map(priviledge => `${service}:${domain}:${priviledge}`)
    );
  });
  it("should return the correct roles with custom roles", async () => {
    const customRolePermissions = ["some-other-permission"];
    const customRolesPermissionsFnFake = fake.resolves(customRolePermissions);
    const customRole = "some-custom-role";
    const result = await rolePermissions({
      roles: [...roles, customRole],
      defaultRoles,
      customRolePermissionsFn: customRolesPermissionsFnFake
    });
    expect(customRolesPermissionsFnFake).to.have.been.calledWith({
      roleId: customRole
    });
    expect(result).to.deep.equal([
      ...priviledges.map(priviledge => `${service}:${domain}:${priviledge}`),
      ...customRolePermissions
    ]);
  });
});
