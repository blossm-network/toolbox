import deps from "./deps.js";

import certifyCustomerBusinessAuthority from "./src/customer/certify_business_authority.js";
import createBusinessAuthority from "./src/business_authority/create.js";
import createBusinessAuthorityDocument from "./src/business_authority/create_document.js";
import createDocument from "./src/customer/create_document.js";
import createReceiveOnlyCustomer from "./src/customer/create_receive_only.js";
import createUnverifiedCustomer from "./src/customer/create_unverified.js";
import createVerifiedBusinessCustomer from "./src/customer/create_verified_business.js";
import createVerifiedPersonalCustomer from "./src/customer/create_verified_personal.js";
import deactivateCustomer from "./src/customer/deactivate.js";
import deleteBusinessAuthority from "./src/business_authority/delete.js";
import getBusinessAuthority from "./src/business_authority/get.js";
import reactivateCustomer from "./src/customer/reactivate.js";
import suspendCustomer from "./src/customer/suspend.js";
import updateBusinessAuthority from "./src/business_authority/update.js";
import updateUnverifiedCustomer from "./src/customer/update_unverified.js";
import updateVerifiedCustomer from "./src/customer/update_verified.js";
import getBusinessAuthorityStatus from "./src/customer/get_business_authority_status.js";

export default (key, secret, { environment }) => {
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
