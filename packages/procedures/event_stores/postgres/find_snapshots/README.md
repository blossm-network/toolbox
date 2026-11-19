A postgres event store server function to get snapshots. It returns at most 100 unless `limit` is given (`null` for all) and forwards a supported `select`.
