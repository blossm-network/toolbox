const { expect } = require("chai").use(require("sinon-chai"));
const { restore, fake } = require("sinon");
const rolePermissions = require("..");

const roles = ["some-role"];
const priviledges = ["some-priviledge"];

const domain = "some-domain";
const service = "some-service";

const defaultRole = {
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
      defaultRoles: [defaultRole]
    });
    expect(result).to.deep.equal(
      priviledges.map(priviledge => {
        return {
          service,
          domain,
          priviledge
        };
      })
    );
  });
  it("should return the correct roles with custom roles", async () => {
    const customRolePermissions = ["some-other-permission"];
    const customRolesPermissionsFnFake = fake.resolves(customRolePermissions);
    const customRole = "some-custom-role";
    const result = await rolePermissions({
      roles: [...roles, customRole],
      defaultRoles: [defaultRole],
      customRolePermissionsFn: customRolesPermissionsFnFake
    });
    expect(customRolesPermissionsFnFake).to.have.been.calledWith({
      roleId: customRole
    });
    expect(result).to.deep.equal([
      ...priviledges.map(priviledge => {
        return { service, domain, priviledge };
      }),
      ...customRolePermissions
    ]);
  });
  it("should return the correct roles with multiple defaultRoles", async () => {
    const otherPriviledges = ["some-other-priviledges"];

    const otherDomain = "some-other-domain";
    const otherService = "some-other-service";

    const result = await rolePermissions({
      roles: [...roles, "some-other-role"],
      defaultRoles: [
        defaultRole,
        {
          domain: otherDomain,
          service: otherService,
          roles: {
            "some-other-role": {
              priviledges: otherPriviledges
            }
          }
        }
      ]
    });
    expect(result).to.deep.equal([
      ...priviledges.map(priviledge => {
        return {
          service,
          domain,
          priviledge
        };
      }),
      ...otherPriviledges.map(priviledge => {
        return {
          service: otherService,
          domain: otherDomain,
          priviledge
        };
      })
    ]);
  });
});
