### 🌸  Blossm   
###### Written for NodeJS

### Blossm is an Event Sourcing CQRS orchestrator, that includes an interace for setting up multi-project interoperability through a shared base layer that handles core components like sessions, accounts, permissions, roles, delivering updated data to subscribers, and more.

#### With Blossm you can architect, fully-test, and deploy just about any peice of software functionality using small javascript functions and YAML configs, in a way that keeps each historical state of your app entirely queriable and auditable, and with the opportunity to interoperate with independently developed networks through a shared base layer. It's also cheap to run, scales reliably and automatically, and is easy to test, maintain, and iterate from.

#### The project aspires to make sure the data produced in Blossm systems can be owned and delegated entirely by the users and groups that produced it, giving Blossm network operators no data aggregation and manipulation advantages over its constituent projects, or even the public.

#### The project also aspires to interoperate with the Ethereum blockchain to provide an application experience layer that can interact with Contracts and respond to events, while providing a function execution and event storage layer for trivial intraday application events that don't need to be on-chain in real time.

### Contents:
1. [Install](#install)
2. [Overview](#overview)
3. [Base layer](#base-layer)
4. [Setup CLI](#setup-cli)
5. [Setup deployment infrastructure](#setup-deployment-infrastructure)
6. [New developer onboarding](#new-developer-onboarding)
7. [TODO](#todo)

---

# Install 

```javascript
npm install -g @blossm/cli
blossm init
```

# Overview

CQRS is an Event Sourcing software architecture pattern where the write and read responsibilites are organized around seperate data stores. 
The write side takes a request, performs a routine, and optionally logs some events with metadata to a store, thus modifying the state of the app forever — the event stores are meant to be immutable.
The read side listens for logged events and uses their payload to write to any number of denormalized view stores to be effeciently queried. All view stores can be destroyed and recreated at any time based on the event log.

For all of its goodness, the tradeoff of CQRS is that it requires a solid understanding of each component - there are several moving parts that must be choreographed. Blossm tries to take as much of this off your hands as possible while giving you total flexibility at the application layer, but getting up and running for the first time and feeling comfortable weilding all the tools is going to take motivation on your part. Each Event Sourcing implementation may be slightly different, but many share common design gotchas and pitfalls. If you're less familiar with the pattern, I'd recommend meandering through some content. Here are some well-articulated videos and papers by some incredible folks around the topic, all of which inspired the choices that were made when developing Blossm in some way or another:

* **Martin Fowler**
  * https://www.youtube.com/watch?v=STKCRSUsyP0&t=206s
  * https://martinfowler.com/bliki/StranglerFigApplication.html
* **Greg Young**
  * https://www.youtube.com/watch?v=LDW0QWie21s
* **David Schmitz** 
  * https://www.youtube.com/watch?v=GzrZworHpIk&t=1612s
* **Carson Farmer** and the folks at Textile
  * https://docsend.com/view/gu3ywqi

*Thank you for all the work you've done and continue to do.* **🍻**

Blossm uses 8 types of procedures, all of which can be run as lambda functions on GCP Cloud Run, configured entirely with `blossm.yaml` files, and deployed with a CLI tool:

On the write side:

* `event-store` 
  Deployed to log events with a shared schema. Events that share a `root` refer to the same entity, and can be aggregated to determine the state of that entity at any point in time. `event-stores` connect to a Collection in a MongoDB Atlas instance. 


* `command`
  Deployed to do a single-purpose job on-demand which has the oportunity to log events throughout it's execution. Commands can call other commands and easily interact with other Blossm procedures. They can also include any other NPM dependency that you want.


* `fact`
  Deployed to deliver some specic information about the state of the app.


* `command-gateway` 
  Deployed to permit external access to a set of `commands` under specified conditions.


* `fact-gateway` 
  Deployed to permit external access to a set of `facts` under specified conditions.


On the read side:

* `view-store` 
  Deployed to store denormalized data that is intended to be queried. `view-stores` connect to a Collection in a MongoDB Atlas.
  

* `projection`
  Deployed to listen for Events and map their data to a `view-store`. If the projection is changed, it can be replayed on-demand using a CLI, which will update the `view-stores` with the most recent mapping.


* `view-gateway` 
  Deployed to permit external access to a set of `view-stores` under specified conditions.


### How ideas are organized within Blossm

Once the purpose of each of the above procedures makes some sense to you, the big question becomes how to use them to solve your application's needs.

Blossm works off of the event sourcing pattern, meaning the state of the app is determined entirely by the chronological aggregation of immutable events that are logged. Events that affect the same *thing* can overwrite previous states of that *thing*. In Blossm, the `root` of an event (a UUID) refers to the *thing* that it affects. When you add all events that have happened to a specic `root` over each other, the result is called the `aggregate root`, which represents the current state of that *thing*.  

For example, if 3 events have been logged into an `event-store`: 

```javascript
{
  headers: {
    root: "123",
    action: "paint"
    created: "<last week>",
    number: 1
  }
  payload: {
    frameColor: "pink",
    handlebarColor: "yellow",
  }
}
{
  headers: {
    root: "123",
    action: "paint"
    created: "<yesterday>",
    number: 2,
  }
  payload: {
    frameColor: "orange",
  }
}
{
  headers: {
    root: "123",
    action: "add-basket"
    created: "<today>",
    number: 3,
  }
  payload: {
    basketLocation: "front",
  }
}
```

The aggregate root, which is the current state of the thing described by `123` would be:

```javascript
{
  headers: {
    root: "123",
    lastEventNumber: 3,
  }
  payload: {
    bodyColor: "orange",
    handlebarColor: "yellow",
    basketLocation: "front",
  }
}
```

With this bit of concrete information in mind, here's an effective way to organize your procedures to get the most out of events:

#### Write-side organization

* `domain` 

  You can think of a `domain` as a labeled category of like *things*, where similar operations can be done to an instance of a particular thing. In the example above, you can imagine these particular set of events with actions "paint" and "add-basket" belonging to a "bicycle" `domain`. 

  Each `domain` has one `event-store` that stores similar events of various `roots`, and can have one `command-gateway` to allow external access to it's `commands`. 


* `service` 

  You can think of a `service` as a labeled category of `domains` that tend to be interdependant. In the example above, you can imagine the "bicycle" `domain` belonging to a "shop" `service`, which may also contain "helmet" and "lights" as other `domains`. 

  Each `service` is made up of any number of interdependant `domains`, meaning any `commands` from within a `service` can freely log events to any of it's `event-stores`. `services` can also depend on functionality from other `services` unidirectionally.


* `network` 

  You can think of the `network` as the top level container of your application. In the example above, you can imagine the "shop" `service` belonging to the "bicyclecity.com" `network`, which may also contain a "staff" `service` that manages functionality and events relating to hiring and scheduling. 
  
  Each `network` is made up of any number of `services` whose `commands` can call each other directly without a gateway. The network can have up to 4 environments: `development`, `staging`, `sandbox`, and `production`.

Here's a visual metaphor:

![alt text](/imgs/write-layers.png "Write organizational layers")

`command-gateways` are addressed by `c.<domain>.<service>.<network>`, so in the example diagram above the commands would be accessible at:

* `c.video.content.youtube.com/upload`
* `c.video.content.youtube.com/change-visibility`
* `c.video.content.youtube.com/finish-viewing`
* etc.

`fact-gateways` are addressed by `f.<domain>.<service>.<network>`

Non-`production` gateways are addressed with a network prefix of `.dev | .stg | .snd`.


#### Read-side organization

Read-side functionality is organized around permissions. Blossm read-side procedures can be organized and easily configured to behave according to very specific intents, such as: only certain accounts should have access to these views, or only certain groups of accounts have access to these views, or: everyone who is authenticated should have access to these views, or the most broad: everyone on the internet should have access to these views.

* `context` 

  Blossm manages permissions most broadly through `contexts`. Without going into the specifics of how permissions work, note that requests are made to `view-gateways` with a cookie containing a JWT token with information about the `contexts` that are accessible by this token. `view-stores` can be placed in a `context` if it can only be accessed by tokens that have that `context` specified.

  For example, let's say you're building a task manager application for a team. Let's say there is a "team" `domain`, and that the `root` of your team is "q1w2e3r4t5y6". Since your account is associated with this team, your session token will have a `context` in it like so:

```javascript
{
  context: {
    team: {
      root: "789",
      service: "your-team-service",
      network: "your-team.network"
    },
    //... there'll be other things in the context.
  }
}
```

Each time you make a request, the Blossm procedures know that you have access to this specific team, and can prevent access at the gateway level if the requesting token is lacking permissions. 

If calling a `view-store` within the "team" context, you'll only be able to access data that was created from the team with `root` "q1w2e3r4t5y6".

The basic use cases of Blossm don't require the knowledge to weild `contexts` in custom ways. 

![alt text](/imgs/read-layers.png "Read organizational layers")

In the example diagram above, the `home-feed` and `search-feed` stores are accessible by any token, and the `history` and `profile` stores are only accessible to a token containing an `account` context.

`view-gateways` are addressed by `v(.<context>)?.<network>`, so in the above examples the views would be accessible at:

* `v.youtube.com/home-feed`
* `v.youtube.com/search-feed`
* `v.account.youtube.com/history`
* `v.account.youtube.com/profile`

Again, non-`production` gateways are addressed with a network prefix of `.dev | .stg | .snd`.

---

# Base layer 

Blossm applications must be built around an implementation of the Blossm base layer, which manages all of the basic stuff that applications need such as accounts, sessions, token issuance, permissions, roles, authentication, and publishing updated views to connected clients. Any application built around the same Blossm base layer can seamlessly interoperate.

There are a few non-required traits of a Blossm base layer that are strongly encouraged:

* A Blossm base layer is encouraged to not collect any personal information to associate with accounts. It is encouraged that accounts be created, verified, and managed through email addresses or Ethereum addresses (or ENS) only.

* A Blossm base layer is encouraged to keep regular snapshots of it's data on an open file system, like FileCoin, for public auditability.

* A Blossm base layer is encouraged to associate wallets to accounts that can be used by any application built around it for sending / receiving payments on Ethereum. Fiat is encouraged, but often requires KYC which is at odds the first bullet. Find a balance and push for progress when it comes to open value transfer.

There aren't yet documented guidelines on how to implement your own Blossm base layer, but there is one implementation currently in Beta done by the Blossm team over at `sustainers.network`. It can be found here: <https://github.com/sustainers-network/blossm>. Reach out if you want to implement a base layer, or help out with the one at sustainers.network. 

It's worth nothing that Blossm base layers are set up just like any other Blossm network, and it's also possible to implement a base layer that's private to your network if interoperability isn't important to you and or you want to implement custom core componentry. 

---

# Setup CLI 

Here's how to set up your Blossm workflow.

If you already use Node, the only thing you'll have to install is the Blossm CLI tool which makes it easy to spin up procedures, run tests, deploy to any environment, replay events over projections, and manage various other details of your application:

```javascript
npm install -g @blossm/cli
```

Then initialize a Blossm project:

```javascript
blossm init
```

The provided `config.yaml` is where you'll specify the configurations of your app, the `services` folder is where you'll write your write-side procedures, and the `contexts` folder is where you'll write your read-side procedures. 

Once you're ready to write procedures and have made sense of how the files are organized, here's how to init each of them:

```javascript
// write side:
blossm event-store init
blossm command init
blossm fact init
blossm command-gateway init
blossm fact-gateway init

// read side:
blossm view-store init
blossm projection init
blossm view-gateway init
```

Each procedure is a small directory made up of a `blossm.yaml` file where it's configured, and a few other files where the necessary peices of functionality can be coded. Here's some info about the file contents of each type of procedure:

On the write side:

* `event-store`
  * `blossm.yaml` - Specify what the `domain` and `service` of this event store are, list the event actions that can be handled, define the schema of a valid event that should be accepted and stored, and write some example events for the unit tests and integration tests to check against that must pass before deployment is possible.
  * `handlers.js` - Write instructions for how to transform the state of an aggregate for each event actions. 

* `command`
  * `blossm.yaml` - Specify what the `domain` and `service` of this command are, define the schema of a valid payload that should be accepted, and write some example payloads for the unit tests and integration tests to check against that must pass before deployment is possible.
  * `main.js` - Write a function that runs when the command is called that does a specific routine. Blossm provides tools to make it easy to call other commands, read from the state of the app, conditionally log new `events`, and return some data to the command issuer from within this function.
  * `normalize.js` - Specify how a valid payload should be cleaned/formatted before its given to `main.js`.
  * `deps.js` - Export external dependencies that can be used in `main.js` and easily mocked out in tests.

* `fact`
  * `blossm.yaml` - Specify what the `domain` and `service` of this fact are, define the schema of a valid payload that should be accepted, and write some example queries for the unit tests and integration tests to check against that must pass before deployment is possible.
  * `main.js` - Write a function that runs when the fact is called that reads from the state of the app or from anywhere else on the internet to produces some formatted data to return the requester.

* `command-gateway`
  * `blossm.yaml` - Specify what the `domain` and `service` of this command-gateway are, list the commands that it exposes, and define the conditions that must be met for a requester to issue each command. 

* `fact-gateway`
  * `blossm.yaml` - Specify what the `domain` and `service` of this fact-gateway are, list the commands that it exposes, and define the conditions that must be met for a requester to get each fact. 

On the read side:

* `view-store`
  * `blossm.yaml` - Specify what the `context` of this view store is, define the schema of a valid view that should be accepted and stored, list the indexes that the store can be queried and sorted by, and write some example queries for the unit tests and integration tests to check against that must pass before deployment is possible.
  * `format.js` - Optionally write a function that each view is passed through on its way to the requester, letting you store raw data that's easy to query and manipulate, while returning a richer determanistically transformed version of that data.

* `projection`
  * `blossm.yaml` - Specify which `view-store` event data gets mapped to, list the event actions that are listened for, and write some example events for the unit tests and integration tests to check against that must pass before deployment is possible.
  * `handlers.js` - Write instructions for how to map aggregate state into views for each state change is listened for. 

* `view-gateway`
  * `blossm.yaml` - Specify what the `context` of this view-gateway fateway, list the view stores that it exposes, and define the conditions that must be met for a requester to query each store. 


Once you're ready to run unit tests locally:

```javascript
blossm test
```

Once you're ready to run unit tests and integration tests remotely:

```javascript
blossm deploy --dry-run 
```

And finally once you're ready to deploy after running unit and integration tests remotely:

```javascript
blossm deploy 
```

You can always replay a projection with:

```javascript
blossm replay 
```

---

# Setup deployment infrastructure 

Make sure you've setup your CLI (previous section) before taking this on.

1. [Compute](#compute)
2. [Databases](#databases)

## Compute 

1. [GCP](#gcp)
2. [Others](#others)

### GCP 

Below are instructions for how to orchestrate your Blossm procedures on Google's Cloud Run serverless infrastructure. Each GCP Organization corresponds to a `network`, and each GCP project within that network corresponds to an environment. The `production` environment is required, but feel free to skip setting up `development`, `staging`, and `sandbox`, if you don't yet need them.

Within each GCP project, you'll be using:

* __Cloud Run__ to serve your Blossm procedures as serverless functions.
* __Cloud Pub/Sub__ to publish messages when `events` are logged, which in turn trigger the execution of relevant `projections`.
* __Cloud Tasks__ to schedule procedure execution on a queue to manage load.
* __Cloud DNS__ to manage your network's top-level domain and any subdomains in your network.
* __Cloud Storage__ to store any static Roles your Blossm application may want to reference, and any encrypted secrets you may want to save ahead of time to give your app runtime access to.
* __Cloud KMS__ to manage cryptographic keys for JWT token signing and to encrypt any secrets you may want to reference during the runtime of your app.
* __Cloud IAM__ to manage permissions and create Service Accounts.
* __Cloud Scheduler__ to schedule commands to be executed later.
* __Cloud Memorystore__ for using a shared cache between procedures for optimization.


#### Web domains

1. Get a domain where your network and websites can be accessed.
    * Update the **config.yaml** file `network` property to your domain name.
    * If you're planning on building on top of a Blossm base layer network, set core to the domain of the network running the base layer that your network will rely on, such as `sustainers.network`.

2. Setup a [Google Workspace](https://workspace.google.com/) account for your domain and create an email address for yourself under this domain. 
    * Go through the steps to setup and verify your domain and setup a gMail account. Sometimes the verification process takes some time to work properly, the MX and TXT records take up to 12 hours to take effect.
    
You should now have access to GCP under your new Google account!

#### GCP project environments

1. Go to GCP. Create separate projects called "production", "sandbox", "staging", and "development" where each environment is contained within your domain’s organization. The project ID’s can be whatever.
    * Set the billing account for the projects when prompted.

2. Update the blossm **config.yaml** file **vendors.cloud.gcp.projects** properties in the repo to point to your newly created project ids.

#### CLI prereqs

1. Download and install the gcloud at https://cloud.google.com/sdk/docs/quickstarts. Move the folder into your home directory and make it invisible ~/.google-cloud-sdk.
Install by running `~/.google-cloud-sdk/install.sh`

2. Run `gcloud auth login` and login to your 

#### Networking

Set up your network domain.

1. Verify that you own the domain on [this site](https://search.google.com/u/1/search-console/users?resource_id=sc-domain).
    * Click **Search Property** at the top left.
      * Click Add property.
      * Add your domain on the left side under *Domain*, and click continue.

2. In the `production` project:
    * In **Network Services > Cloud DNS**, enable Cloud DNS.
      * Create a public DNS Zone named **“network”**. With DNS name \[your-domain\].
        * Turn on DNSSEC.
      * Set the Name servers of your domain in its domain registry to the data of the NS record set.
      * If you set TXT and MX records in your domain registry as part of step 3 of Initial Setup, move those records to GCP also.
  
3. In the `development` project:
    * In **Network Services > Cloud DNS**, enable Cloud DNS.
      * Create a public DNS Zone named **“network”**. With DNS name dev.\[your-domain\].
        * Turn on DNSSEC.
      * Note the NS Data domains. There should be four.

4. Back in the `production` project:
    * Add a record set named dev.\[your-domain\] of type NS. 
    * Add the NS data domains from step 2 as name servers.

5. Repeat steps 2 & 3 with the `sandbox` and `staging` projects using snd.[your domain] and stg.[your domain].

6. Visit [this](https://www.google.com/webmasters/verification/home?hl=en) site and add your domain as a property. You’ll be given a TXT record to use. Keep this site open.

7. Back in the `production` project:
    * Add a record set for your domain of type TXT. For the value, use the one show on the page from step 7. 

8. Click Verify on this site from step 7. Sometimes it takes a little while for the TXT record to propagate, so keep trying to verify if you don’t succeed at first.


#### VPC

Create a private network for your serverless procedures to interact with one another through.

1. In the `development` project:
    * In **VPC network > Serverless VPC** access, enable Serverless VPC access API.
    * Create a connector named **"us-central1-network"** in the us-central1 region under the default network with ip range **10.8.0.0/28**.

2. Repeat step 1 with the `production`, `sandbox` and `staging` projects. 


#### Permissions

Lets specific Blossm processes manipulate specific parts of your compute infrastructure on your behalf, and gives your developers specified access to certain Blossm CLI tools.

1. In the `development` project:
  * In **Cloud Build**, enable the Cloud Build API. 
  * In **IAM & Admin > Roles**, create a Role named **“Blossm Developer”** with id **“BlossmDeveloper”** in Alpha role launch stage. This will be the role given to developers’ machines. Give it the permissions:
      * **storage.buckets.create** - allows the machine to create storage buckets.
      * **storage.objects.create** - allows the machine to store objects in buckets, including the build artifacts and the encrypted key in a storage bucket.
      * **cloudkms.cryptoKeys.create** - allows the machine to create crypto keys.
      * **cloudkms.cryptoKeyVersions.useToEncrypt** - allows the machine to encrypt a message using a Crypto key.
      * **cloudtasks.queues.create** - allows the machine to create task queues.
      * **cloudtasks.tasks.create** - allows the machine to create tasks.
      * **iam.serviceAccounts.actAs** - allows the machine to execute commands.
   * In **IAM & Admin > Service Accounts**, grant the **Service Account User** role to the **Cloud Build** service account on the **\[projectNumber\]-<span>compute</span>@developer.gserviceaccount.com** Service Account. See [here](https://cloud.google.com/cloud-build/docs/deploying-builds/deploy-cloud-run) and [here](https://cloud.google.com/run/docs/reference/iam/roles#additional-configuration) for more info.
      * Do this by clicking the checkbox next to the **\[projectNumber\]-<span>compute</span>@developer.gserviceaccount.com** Service Account in the table, then clicking **Show info panel** at the top right.
      * Click **Add member** and locate the **\[projectNumber\]@cloudbuild.gserviceaccount.com**. Select the **Service Account User** role, then save.
   * **In IAM & Admin > IAM**, add the following roles to the **@cloudbuild.gserviceaccount.com** service account (the same one from the previous step):
      * **Cloud Run Admin** - allows the build process to deploy services.
      * **Cloud Tasks Queue Admin** - to create queues.
      * **DNS Administrator** - to configure domains.
      * **Pub/Sub Admin** - to create topics and subscriptions.
      * **Cloud Scheduler Admin** - to create and modify jobs.
      * **Cloud KMS CryptoKey Signer/Verifier** - to sign and verify messages. Used in integration tests.
      * **Cloud KMS CryptoKey Encrypter/Decrypter** - to encrypt and decrypt messages. Used in integration tests.
      * **Cloud KMS Admin** - to create keys for private event-stores.
      * **Service Account User** - to assign a push subscription to a Cloud Run service. 
   * In **IAM & Admin > IAM**, remove any roles associated with the **\[projectNumber\]-<span>compute</span>@developer.gserviceaccount.com** service account, and instead grant it the following roles:
      * **Cloud Run Invoker** - allows a service to invoke other services.
      * **Storage Object Viewer** - allows a service to access buckets for secrets and roles.
      * **Cloud KMS CryptoKey Encrypter/Decrypter** - to decrypt encrypted values.
      * **Cloud KMS CryptoKey Signer/Verifier** - to sign data with encryption keys, and verify the signatures.
   * In **IAM & Admin > Service Accounts**
      * Create a service account named **“Executer”** with ID **executer@**. Give it roles:     
        * **Cloud Run Invoker** - allows the tasks queue executer to invoke Blossm services.
        <!-- * **Service Account User** - not quite sure why. TODO. -->
      * Create a service account named **“Cloud Run PubSub Invoker”** with ID **cloud-run-pubsub-invoker@**. Give it the roles:
        * **Cloud Run Invoker** - allows pubsub to invoke Blossm services.

2. Repeat step 1 with the `production`, `sandbox` and `staging` projects.

3. In the **development** project:
    * Give the **@cloudbuild.gserviceaccount.com** service account ownership over the domain you registered in the Networking section by going to [this site](https://search.google.com/u/1/search-console/users?resource_id=sc-domain), selecting your domain from the top-left menu, and clicking settings.
      * Next to your name, it should say Owner and have a three-dot menu. Click the menu and select Manage Property Owners.
        * In the new site, click on your domain in the Properties list.
          * At the bottom you should see a button to Add an owner. 
            * Add the email address of the **@cloudbuild.gserviceaccount.com** service account.	

4. Repeat step 3 with the **production**, **sandbox** and **staging** projects.

#### Authentication

Create keys that will be used by your application to verify the authenticity of certain functionality.

1. In the `development` project:
    * In **Security > Cryptographic Keys**, enable **Cloud KMS**.
    * Create a global Key Ring named **“jwt”**. 
      * Create a Generated key named **“access”** for Asymmetric signing using Elliptic Curve P-256 - SHA256 Digest.
      * Create two other keys in the same ring with the same specs named **“challenge”** and **"updates"**.

2. Repeat step 1 with the `production`, `sandbox` and `staging` projects. 

#### Blockchain 

Blossm keeps a blockchain in your `event-store` which can be useful when auditing your system. Information for verifying the authenticity of any event is stored in your blockchain. Configuring it is easy:

1. In the `development` project:
    * In **Security > Cryptographic Keys**, enable **Cloud KMS**.
    * Create a global Key Ring named **“blockchain”**. 
      * In it, create a Generated key named **“producer”** for Asymmetric signing using Elliptic Curve P-256 - SHA256 Digest.
      * Create another Generated key named **“private”** for Symmetric signing with a rotation period of your choosing. 90 days is fine.

2. Repeat step 1 with the `production`, `sandbox` and `staging` projects. 

3. In your **config.yaml** file, change the `blockSchedule` property to reflect how often you want blocks issued. Note that snapshots of each root also get made and stored when creating a block. 

#### Secrets 

Configure the storage of encrypted secrets that your application decrypts and uses during runtime using Blossm tools.

1. In the `development` project:
    * In **Security > Cryptographic Keys**, create a global Key ring named **“secrets-bucket”**. No need to create a key in it.

2. Repeat step 1 with the `production`, `sandbox` and `staging` projects. 

3. Back in the `development` project:
    * In **Storage > Browser**, create a storage bucket where encrypted secrets will be stored.
    * Give it some unique name, like "development-secrets-12345".
    * Keep all the default options, or change them if you want.

4. Repeat step 3 with the `production`, `sandbox` and `staging` projects. 

5. Update the top level Blossm `config.yaml` so that the properties **vendors.cloud.gcp.secretsBuckets** reference the secrets Storage bucket names.

The command to save a secret using the CLI is:

```javascript
blossm secret create mongodb -m <YOUR-SECRET> -e <development, staging, sandbox, or production>
```

#### Roles

Configure the storage of roles that your application uses during runtime.

1. In the `development` project:
    * In **Storage > Browser**, create a storage bucket where your roles.yaml file will be stored.
    * Give it some unique name, like "development-roles-12345".
    * Keep all the default options, or change them if you want.

2. Repeat step 1 with the `production`, `sandbox` and `staging` projects. 

5. Update the top level Blossm `config.yaml` so that the properties **vendors.cloud.gcp.rolesBuckets** reference the role Storage bucket names.

#### Tasks

Configure the task queues that Blossm uses to manage load and asychronisity.

1. In the `development` project:
    * In **APIs & Services**, select the **Cloud Tasks API**.
      * Enable the API.
    * In **App Engine**, click **"Create an Application"** in us-central1.
      * There’s no need to fill out subsequent forms. Just cancel out.
 
2. Repeat step 1 with the `production`, `sandbox` and `staging` projects. 

###### [Deploy your database](#databases) and [onboard a developer](#new-developer-onboarding), then proceed to the next section.

#### Deploying 

At this point you should have the majority of GCP configured, your MongoDB Atlas stores configured, and your **config.yaml** almost entirely filled out to tie it all together.
  * **vendors.gcp.computeUrlIds** should still be blank. You'll get to this soon. 

You're now ready to deploy your first procedures. You'll do so while filling out a few final peices of your GCP along the way.

1. * In **APIs & Services**, select the **Cloud Run API**.
      * Enable the API.

2. In your blossm directory, `cd services/animals/domains/birds/event_store`.

3. Deploy your event store, `blossm deploy`. This should take about 5 minutes as it runs all of your unit and integration tests, wires up the store with everything it needs to do its job, and deploys it to the network where it immediately becomes available.

4. In **Cloud Run**, there should be one row in the table, which represents the event store you just deployed. Click it.
Somewhere at the top, you should see the service’s URL, which ends in **XXXXXXXXX.<region>.run.app**. Copy the **XXXXXXXXX** part of the address and paste it in your **config.yaml** for the **computeUrlIds** property.

5. Now let's go to your command, `cd ../commands/chirp`.

6. Deploy it with `blossm deploy`. Instead if you had wanted to run unit test locally, try `blossm test`. If you want to run unit and integrations tests remotely, go with `blossm deploy --dry-run`. Add `-e <production | sandbox | staging | development>`, otherwise the default environment specified in **config.yaml** is used.

7. Now let's go to the command gateway, `cd ../../command_gateway`.

8. Deploy it with `blossm deploy`. By the way, check out the **blossm.yaml** of each of these folders were deploying from to get a sense of how they work.

9. It takes about 20 minutes for a new URL to become available the first time you deploy it, so sit tight, you'll soon be able to issue your first command to `https://c.bird.animals.<YOUR_NETWORK>/chirp`

10. Now let's deploy the procedures you'll need to read the data. Go to your projection `cd ../../../../../views/stores/dashboard/view_store`.

11. Deploy it with `blossm deploy`. 

12. Next, your projection `cd ../projection` followed by `blossm deploy`

13. * In **Pub/Sub > Subscriptions**, there should be one row in the table, which represents the subscription from the projection you just deployed. Click it.
      * Click **Edit** at the top. 
      * Under "Enable authentication", you should see a form that pops up that says "Cloud Pub/Sub needs the role roles/iam.serviceAccountTokenCreator granted to service account [<SOME IDENTIFIER>]@gcp-sa-pubsub.iam.gserviceaccount.com on this project to create identity tokens. You can change this later.".
        * Click **"Grant"**. You'll only have to do this once.

14. Lastly you'll want to deploy your view gateway, `cd ../../view_gateway` and `blossm deploy`

15. Again, it takes about 20 minutes for a new URL to become available the first time you deploy it, so sit tight, you'll soon be able to access your first view at `https://v.<YOUR_NETWORK>/dashboard`

16. If you ever want to replay events over your projection to update the view store, run `blossm replay` within the projection directory.


### Others

Only a GCP adapter is currently implemented. If other's are needed, I'd be happy to support their development.

## Databases

1. [MongoDB Atlas](#mongodb-atlas)
2. [Others](#others)

### MongoDB Atlas

Below are instructions for setting up `view-stores` or `event-stores` on MongoDB Atlas, connected to from GCP. To connect from another compute infrastructure, some modifications may be warranted to get the most out of your setup.

1. (Create a MongoDB Atlas account)[https://account.mongodb.com/account/register].

2. Create an Organization with the name of your `network`, and a project named **"development-event-store"**.

3. Create a **Shared** cluster for free (you can upgrade this later).
    * If your compute is through GCP, have your databases also run on GCP. The **"us-central1"** region is a good starting spot if you're unsure of a region to setup in. 
    * The Cluster Tier can be kept as M0 Sandbox, and the additional settings left as-is.
    * Change the cluster name to **"event-store"**, and click Create.

4. On the left side of the screen, click on **Database access**.
    * Add a new database user.
      * Name the user **"blossm"**, create a password for it, and make sure it has access to read and write from any database.
      * Save the password to blossm on the cli with:
      ```javascript
      blossm secrets create mongodb-event-store -m <YOUR MONGODB USERPASSWORD> -e development
      ```

5. On the left side of the screen, click on **Network access**.
    * Add a new IP address to the access list.
      * If your compute is through GCP, enter the same IP address specified for your GCP VPC serverless setup, **10.8.0.0/28**.
      * You can leave a description such as "GCP default VPC serverless connection".

6. On the left side of the screen, click back to **Clusters**.
    * Click **"Connect"** on your "event-store" cluster, and then "Connect to your application".
    * You should see a connection string. You’ll want to pick out pieces of this string and them to the **config.yaml** file under **vendors.eventStore.mongodb**
      * The protocol is the bit before the ://
        * i.e. mongodb+srv
      * The host is the bit between the @ and the first /

7. In the second dropdown from the top-left, you'll see an option to **"Create a new project"**. Name this project **"development-view-store"**
  * Repeat steps 3-6 for this project.

8. Repeat steps 2-7 for the rest of your staging, sandbox, and production stores. 


### Others

Only a MongoDB adapter is currently implemented. Again, if other's are needed, I'd be happy to support.

---

# New developer onboarding

Once you've got a deployment environment set up, here's how to get a new developer writing, testing, and deploying Blossm procedures.

### GCP

1. In the `development` project:
    * In **IAM > Service Accounts**, create a Service Account for a developer’s machine with the role **Blossm Developer** given to it.
    * Create a key for this Service Account. Download it to the developers machine, and create an environment variable named **GOOGLE_APPLICATION_CREDENTIALS** that points to where the key file is stored.

2. In the `staging` project:
    * In **IAM & Admin > IAM**, add a service account.
      * Add the email of the service account created in step 1 with the role **Blossm Developer**.

3. Repeat step 2 with the `production` and `sandbox` projects if the developer should have access to those environments.

### Others

Only a GCP adapter is currently implemented.

----

# TODOs 

#### Organizational

- [x] Start documentation for Blossm. 
- [ ] Add an "examples" top level directory with a bunch of examples of what each procedure can do, from simple cases to more complex ones. 
- [x] Document MongoDB Atlas deployment info. 
- [ ] Add documentation about adding a permission once a subscription has been made. 
- [ ] Add a hello world application that is included with `blossm init`. 
- [ ] Create richer docs with more specifics about the inputs and expected outputs of certin procedure functions. 

#### Code

- [ ] Pull out GCP functionality from the `cli` directory into an `adapters` directory to make it easy to implement Blossm on other prociders.
- [ ] Pull out `//cli/src/projection/deploy/src/index` into `//procedures/projection` and write tests for it.
- [ ] Resolve leftover `TODO`s in the codebase.
- [ ] Write a script that automates the GCP deployment setup.
- [ ] Create gRPC interfaces for each procedure.


#### Design

- [ ] Implement a landing page website for Blossm.
- [ ] Implement a documentation website to accommodate rich implementation guidelines.