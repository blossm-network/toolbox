Publishes to PubSub.

`subscribe({ topic, name, fn })` reuses an existing subscription, or awaits its
creation, then attaches `fn` to message events. It returns the SDK subscription.
The consumer owns message acknowledgement (`ack`/`nack`), its error listener and
transport cleanup (`close`). Subscribing does not discard an existing backlog.
`unsubscribe({ topic, name })` explicitly deletes the remote subscription.
