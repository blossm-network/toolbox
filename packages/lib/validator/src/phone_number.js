import { string as stringValidator } from "@blossm/validation";
import phoneNumber from "@blossm/phone-number";

export default (
  value,
  { baseMessageFn, title = "phone number", path, optional } = {}
) =>
  stringValidator({
    value,
    title,
    path,
    baseMessageFn,
    refinementMessageFn: (value, title) =>
      `This ${title} isn't formatted right. Try again after making a change to it.`,
    refinementFn: (number) => phoneNumber.format(number) != null,
    optional,
  });
