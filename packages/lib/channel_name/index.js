// A channel's name, built so that no two different sets of parts can ever give
// the same name. Whoever can publish to a name reaches its subscribers, so a
// name that two owners could both arrive at would let one write to the other.
//
// - The network that owns the view comes right after the name.
// - A network's dots become underscores, which no network name contains, so
//   "foo.com" followed by a part named "au" is never "foo.com.au".
// - Every other part is a plain name with no dot in it.
// - Each optional group opens with its own letter and has a fixed number of
//   parts, so a key followed by a principal is never read as a context.
//
// Parts that cannot be written this way are refused, not bent to fit.
const plain = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
const host =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/;

const refuse = (what) => {
  throw new TypeError(`A channel can't be named with this ${what}.`);
};
const part = (value, what) =>
  (typeof value == "string" || typeof value == "number") &&
  plain.test(String(value))
    ? String(value)
    : refuse(what);
const networkPart = (value, what) =>
  typeof value == "string" && host.test(value.toLowerCase())
    ? value.toLowerCase().replaceAll(".", "_")
    : refuse(what);

export default ({ name, network, context, key, principal }) =>
  [
    part(name, "name"),
    networkPart(network, "network"),
    ...(context
      ? [
          "c",
          part(context.root, "context root"),
          part(context.domain, "context domain"),
          part(context.service, "context service"),
          networkPart(context.network, "context network"),
        ]
      : []),
    ...(key == undefined ? [] : ["k", part(key, "key")]),
    ...(principal
      ? [
          "p",
          part(principal.root, "principal root"),
          part(principal.service, "principal service"),
          networkPart(principal.network, "principal network"),
        ]
      : []),
  ].join(".");
