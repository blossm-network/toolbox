module.exports = ({ replayStores, playFn, rootStreamFn }) => async (_, res) => {
  await Promise.all(
    replayStores.map((store) =>
      rootStreamFn({
        domain: store.domain,
        service: store.service,
        fn: ({ root }) =>
          playFn({ root, domain: store.domain, service: store.service }),
      })
    )
  );
  res.sendStatus(204);
};
