export default ({ protocol, host, path = "", id }) => {
  return `${protocol}://${host}${path}${id != undefined ? `/${id}` : ""}`;
}