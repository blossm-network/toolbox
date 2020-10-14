### Blossm is a javascript Event Sourcing CQRS orchestrator. 

CQRS is an Event Sourcing software architecture pattern where the write and read responsibilites are organized around seperate data stores. 
The write side takes a request, performs a routine, and optionally logs some events with metadata to a store, thus modifying the state of the app forever — the event stores meant to be immutable.
The read side listens for logged events and uses their metadata to write to any number of denormalized view stores to be queried. All view stores can be destroyed and recreated at any time based on the event log. 

Blossm currently has adapters to run on GCP using a MongoDB database for its stores, but adapters can be built to deploy procedures on any compute server using a database of your choice.

Blossm does this with 8 types of procedures, all of which can be run as lambda functions on GCP Cloud Run, configured entirely with `blossm.yaml` files, and deployed with a CLI tool:

On the write side:

* `event-store` - Deployed to log events with a shared schema. Events that share a `root` refer to the same entity, and can be aggregated to determine the state of that entity at any point in time. `event-stores` connect to a Collection in a MongoDB Atlas instance. 

* `command` - Deployed to do a single-purpose job on-demand which has the oportunity to log events throughout it's execution. Commands can call other commands.

* `fact` - Deployed to deliver some specic information about the state of the app.

* `command-gateway` - Deployed to permit access to a set of `commands` under specified conditions.

* `fact-gateway` - Deployed to permit access to a set of `facts` under specified conditions.


On the read side:

* `view-store` - Deployed to store denormalized data that is intended to be queried. `view-stores` connects to a Collection in a MongoDB Atlas.

* `projection` - Deployed to listen for Events and map their data to a `view-stores`. If the projection is changed, it can be replayed on-demand using a CLI, which will update the `view-stores` with the most recent mapping.

* `view-gateway` - Deployed to permit access to a set of `view-stores` under specified conditions.


### Write-side organization

Functionality is organized in 3 layers that outline how to configure procedures, and are named by the application designer.

* `domain` - Each `domain` has one `event-store` and can have one `command-gateway` to allow external access to it's `commands`.

* `service` - Each `service` is made up of any number of interdependant `domains`, meaning any `commands` from within a `service` can freely log events to any of it's `event-stores`. `services` can also depend on functionality from other `services` unidirectionally.

* `network` - Each network is made up of any number of `services` who's `commands` can call each other directly without a gateway. The network can have up to 4 environments: `development`, `staging`, `sandbox`, and `production`.

![alt text](/imgs/write-layers.png "Write organizational layers")

`command-gateways` are addressed by `c.<domain>.<service>.<network>`, so in the above examples the commands would be accessible at:

* `c.video.content.youtube.com/upload`
* `c.video.content.youtube.com/change-visibility`
* `c.video.content.youtube.com/finish-viewing`
* etc.

`fact-gateways` are addressed by `f.<domain>.<service>.<network>`

Non-`production` gateways are addressed with a network prefix of `.dev | .stg | .snd`.


### Read-side organization

Functionality is organized in 2 layers that are based on permissions. The way these layers work are slightly different from how the read-side works, although the nesting structure is similar. 

* `context` - Without going into the specifics of how permissions work, note that requests are made to `view-gateways` with a cookie containing a JWT token with information about the `contexts` that are accessible. `view-stores` can be placed in a `context` if it can only be accessed by tokens that have that `context` specified.

* `network` - This is the same `network` as the write-side.

![alt text](/imgs/read-layers.png "Read organizational layers")

In the example above, the `home-feed` and `search-feed` stores are accessible by any token, and the `history` and `profile` stores are only accessible to a token containing an `account` context.

`view-gateways` are addressed by `v(.<context>)?.<network>`, so in the above examples the views would be accessible at:

* `v.youtube.com/home-feed`
* `v.youtube.com/search-feed`
* `v.account.youtube.com/history`
* `v.account.youtube.com/profile`

Again, non-`production` gateways are addressed with a network prefix of `.dev | .stg | .snd`.

---

... documentation to be continued ...

### Anatomy of an Event
### Life of an Event