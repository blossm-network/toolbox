import tcombValidation from "tcomb-validation";

const { maybe, validate } = tcombValidation;

let process = (val, filter, { context = {}, path, optional }) => {
  if (optional) return process(val, maybe(filter), { context, path });
  return validate(val, filter, { context, path });
};

export default process;
