import crypto from "crypto";
import kms from "@google-cloud/kms";

export default {
  crypto,
  Client: kms.KeyManagementServiceClient,
};
