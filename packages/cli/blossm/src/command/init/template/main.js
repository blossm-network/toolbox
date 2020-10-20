/**
 
Specifies the command logic.

The docs at the bottom give in-depth info of the tools you have at your disposal.

**/

//const deps = require("./deps");

module.exports = async ({
  payload,
  // uncomment the stuff you need.
  // root,
  // context,
  // aggregateFn,
  // commandFn,
  // queryAggregatesFn,
  // readFactFn,
  // streamFactFn,
  // countFn,
  // logEventsFn,
  // generateRootFn,
}) => {
  // ** Perform a routine if needed. **

  return {
    events: [
      {
        action: "chirp",
        payload,
        // root,
        correctNumber: 0,
      },
    ],
  };
};

/**
 
The function is passed destructured arguments:

  • the `payload` param from the request (req.body.payload).

  • the `root` that is being commanded if it was passed in from the request (req.body.root).

  • the `context` that the command is being issued from.

  • the `options` that may have been passed in if the command was being called 
    internally from another command.

  • an async `aggregateFn`
    that takes positional arguments:
      1. the root to aggregate.
      2. an optional object with:
        • an optional `domain` of the root being aggregated. Defaults to the current domain.
        • an optional `service` of the root being aggregated. Defaults to the current service.
        • an optional `network` of the root being aggregated. Defaults to the current network.
        • an optional `notFoundThrows` boolean that determines whether the function throws or
          returns null if the root isn't found. Defaults to true.
    and returns:
      If found, an object with:
        • the `state` of the aggregate.
        • the `lastEventNumber` that the aggregate included.
        • the `root` of the aggregate, which will be the same as what was inputed.
        • the `groups` the aggregate is associated with.
      Else, a 404 or null depending of the value of the `notFoundThrows` input.

  • an async `commandFn` 
    that takes destructured arguments:
      • the `name` of the command to issue.
      • the `domain` the command being issued is in.
      • an optional `service` the command being issued is in.
        Defaults to the current service.
      • an optional `network` the command being issued is in. 
        Defaults to the current network.
      • the `payload` to issue the command with. 
      • an optional `root` to issue the command on.
      • an optional `options` object that can be sent if the command being issued 
        is within this network.
      • an optional `context` that the request should be made in.
        Defaults to the same context this command is being made in.
      • an optional `async` boolean that determines whether the command 
        is added to a task queue for buffered asynchronous execution, 
        or if the synchronous execution of the command should be awaited 
        along with its response. Defaults to true.
      • an optional `wait` time in seconds that must pass at a minimum before
        the command is executed, if the command is being issued async. 
        Defaults to 0.
      • an optional `principal` value that's only relevant if making
        a request to a different network. It's value can be either "issuer" or "network".
        If "issuer", the request will be sent to the fact procedure as if it were comin
        from the issuer of this command. Otherwise if "network" is specified, the request
        will be sent as if it were initiated by your network. Defaults to "issuer".
    and returns:
      • If the await input is false, an object with:
        • a `body` with the value returned from the command.

  • an async `queryAggregatesFn` 
    that takes destructured arguments:
      • the `domain` to query in.
      • the `service` of the domain being queried in.
      • the `network` of the domain being queried in. 
      • the `key` to query against. 
      • the `value` to query for.
    and returns:
      If found, an array of objects with:
        • the `root` of the aggregate.
        • the `state` of the aggregate.
      Else, an empty array.

  • an async `countFn`
    that takes destructured arguments:
      • the `root` to get the event count of.
      • the `domain` of the root.
      • the `service` of the root.
    and returns the number of events that have been logged for inputed root.

  • an async `readFactFn`
    that takes destructured arguments:
      • the `domain` of the fact being read.
      • the `service` of the fact being read.
      • the `network` of the fact being read. 
      • an optional `query` to be passed along to the fact. 
      • an optional `root` to passed along to the fact.
      • an optional `context` that the request should be made in.
        Defaults to the same context this command is being made in.
      • an optional `principal` value that's only relevant if making
        a request to a different network. It's value can be either "issuer" or "network".
        If "issuer", the request will be sent to the fact procedure as if it were comin
        from the issuer of this command. Otherwise if "network" is specified, the request
        will be sent as if it were initiated by your network. Defaults to "issuer".
    and returns:
      • An object with:
        • a `body` with the value returned from the fact.

  • an async `streamFactFn`
    that takes destructured arguments:
      • an async `fn` that gets called with an object as it becomes 
        available through the streamed with.
      • the `domain` of the fact being read.
      • the `service` of the fact being read.
      • the `network` of the fact being read. 
      • an optional `query` to be passed along to the fact. 
      • an optional `root` to passed along to the fact.
      • an optional `context` that the request should be made in.
        Defaults to the same context this command is being made in.
      • an optional `principal` value that's only relevant if making
        a request to a different network. It's value can be either "issuer" or "network".
        If "issuer", the request will be sent to the fact procedure as if it were comin
        from the issuer of this command. Otherwise if "network" is specified, the request
        will be sent as if it were initiated by your network. Defaults to "issuer".
    and doesn't return anything.

  • an async `submitEventsFn`
    that takes positional arguments:
      1. an array of events to submit, with each event formatted exactly like the events
        that can be submitted through the returned value of the function.
    and doesn't return anything.

  • a `generateRootFn`
    that takes no arguments,
    and returns a new root to for you to associate with events.

and returns:
  • an `events` array with objects with:
     • the `root` of the event being for.
     • the `payload` being logged with the event.
     • the `action` of event being logged.
     • an optional `correctNumber` to ensure the order the event is logged in.
     • an optional `domain` of the root that the event is being logged for. 
       Defaults to the current domain.
     • an optional `service` of the root that the event is being logged for. 
       Defaults to the current service.
  • an optional `response` object to return to the issuer
  
*/
