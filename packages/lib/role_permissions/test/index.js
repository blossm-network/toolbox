const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake } = require("sinon");
const rolePermissions = require("..");

const roles = ["some-role"];
const permissions = ["some-permission"];
const defaultRoles = {
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
      defaultRoles
    });
    expect(result).to.deep.equal(permissions);
  });
  it("should return the correct roles with custom roles", async () => {
    const customRolePermisisons = ["some-other-permission"];
    const customRolesPermissionFnFake = fake.resolves(customRolePermisisons);
    const customRole = "some-custom-role";
    const result = await rolePermissions({
      roles: [...roles, customRole],
      defaultRoles,
      customRolePermissionsFn: customRolesPermissionFnFake
    });
    expect(customRolesPermissionFnFake).to.have.been.calledWith({
      roleId: customRole
    });
    expect(result).to.deep.equal([...permissions, ...customRolePermisisons]);
  });
});
