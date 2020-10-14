### Blossm is a javascript Event Sourcing CQRS orchestrator. 

CQRS is a Event Sourcing software architecture pattern where the write and read responsibilites are organized around seperate data stores. 
The write side takes a request, performs a routine, and optionally logs some events with metadata to a store, thus modifying the state of the app forever — the event stores are immutable. 
The read side listens for logged events and uses their metadata to write to any number of denormalized view stores to be queried, and which can be destroyed and recreated at any time based on the event log. 

Blossm does this with 8 types of procedures, all of which can be run as lambda functions on GCP Cloud Run, configured entirely with blossm.yaml files, and deployed with a CLI:

On the write side:

* `event-store` - Deployed to log events with a shared schema. Events that share a `root` refer to the same entity, and can be aggregated to determine the state of that entity at any point in time. `event-store`s connect to a Collection in a MongoDB Atlas instance. 

* `command` - Deployed to do a single-purpose job on-demand which has the oportunity to log events throughout it's execution. Commands can call other commands.

* `fact` - Deployed to deliver some specic information about the state of the app.

* `command-gateway` - Deployed to permit access to a set of `command`s under specified conditions.

* `fact-gateway` - Deployed to permit access to a set of `fact`s under specified conditions.


On the read side:

* `view-store` - Deployed to store denormalized data that is intended to be queried. `view-store`s connects to a Collection in a MongoDB Atlas.

* `projection` - Deployed to listen for Events and map their data to a `view-store`. If the projection is changed, it can be replayed on-demand using a CLI, which will update the `view-store` with the most recent mapping.

* `view-gateway` - Deployed to permit access to a set of `view-store`s under specified conditions.


### Write-side Organization

Functionality is organized in 3 layers that outline how to configure procedures.

* `domain` - Each `domain` has one `event-store` and can have one `command-gateway` to allow external access to it's `command`s.

* `service` - Each `service` is made up of any number of interdependant `domain`s, meaning any `command`s from within a `service` can freely log events to any of it's `event-store`s. `service`s can also depend on functionality from other `service`s unidirectionally.

* `network` - Each network is made up of any number of `service`s who's `command`s can call each other directly without a gateway. The network can have up to 4 environments: `development`, `staging`, `sandbox`, and `production`.

`command-gateways` are addressed by c.<domain>.<service>.<network>
`fact-gateways` are addressed by f.<domain>.<service>.<network>

Non-`production` gateways are addressed with a network prefix of .dev | .stg | .snd.
