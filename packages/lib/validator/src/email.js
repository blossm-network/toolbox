import { string as stringValidator } from "@blossm/validation";
import emailValidator from "@blossm/email-validator";

export default (
  value,
  { baseMessageFn, title = "email", path, optional } = {}
) =>
  stringValidator({
    value,
    baseMessageFn,
    title,
    path,
    refinementMessageFn: (_, title) =>
      `This ${title.toLowerCase()} isn't formatted right, maybe it’s a typo? Try again after making a change to it.`,
    refinementFn: (email) => {
      const valid = emailValidator(email);
      if (!valid) throw `${email} is not a valid email.`;
    },
    optional,
  });
