// The account a deployed service runs as. Cloud Run uses the project's default
// compute account when none is configured; builds are submitted to the
// project, so Cloud Build substitutes its number.
//
// A service queues tasks and is checked in on as this account, never as one
// shared between services, so each service decides exactly who may call it.
export default ({ serviceAccount } = {}) =>
  serviceAccount ?? "${PROJECT_NUMBER}-compute@developer.gserviceaccount.com";
