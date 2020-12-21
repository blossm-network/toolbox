const deps = require("./deps");

const certifyCustomerBusinessAuthority = require("./src/customer/certify_business_authority");
const createBusinessAuthority = require("./src/business_authority/create");
const createBusinessAuthorityDocument = require("./src/business_authority/create_document");
const createDocument = require("./src/customer/create_document");
const createReceiveOnlyCustomer = require("./src/customer/create_receive_only");
const createUnverifiedCustomer = require("./src/customer/create_unverified");
const createVerifiedBusinessCustomer = require("./src/customer/create_verified_business");
const createVerifiedPersonalCustomer = require("./src/customer/create_verified_personal");
const deactivateCustomer = require("./src/customer/deactivate");
const deleteBusinessAuthority = require("./src/business_authority/delete");
const getBusinessAuthority = require("./src/business_authority/get");
const reactivateCustomer = require("./src/customer/reactivate");
const suspendCustomer = require("./src/customer/suspend");
const updateBusinessAuthority = require("./src/business_authority/update");
const updateUnverifiedCustomer = require("./src/customer/update_unverified");
const updateVerifiedCustomer = require("./src/customer/update_verified");
const getBusinessAuthorityStatus = require("./src/customer/get_business_authority_status");

module.exports = (key, secret, { environment }) => {
  const dwolla = deps.dwolla(key, secret, { environment });
  return {
    businessAuthority: {
      get: getBusinessAuthority(dwolla),
      create: createBusinessAuthority(dwolla),
      delete: deleteBusinessAuthority(dwolla),
      update: updateBusinessAuthority(dwolla),
      createDocument: createBusinessAuthorityDocument(dwolla),
    },
    customer: {
      certifyBusinessAuthority: certifyCustomerBusinessAuthority(dwolla),
      createReceiveOnly: createReceiveOnlyCustomer(dwolla),
      createUnverified: createUnverifiedCustomer(dwolla),
      createVerifiedBusiness: createVerifiedBusinessCustomer(dwolla),
      createVerifiedPersonal: createVerifiedPersonalCustomer(dwolla),
      deactivate: deactivateCustomer(dwolla),
      reactivate: reactivateCustomer(dwolla),
      suspend: suspendCustomer(dwolla),
      updateUnverified: updateUnverifiedCustomer(dwolla),
      updateVerified: updateVerifiedCustomer(dwolla),
      createDocument: createDocument(dwolla),
      getBusinessAuthorityStatus: getBusinessAuthorityStatus(dwolla),
    },
  };
};
