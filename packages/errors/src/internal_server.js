const { InternalServerError } = require("restify-errors");
const { stripIndents } = require("common-tags");

module.exports = {
  ///These shouldnt happen if everything is working normally.
  cantIssueTokenWithoutRequester: new InternalServerError(
    stripIndents`Can't issue token without requester`
  ),
  expenseDoesntBelong: new InternalServerError(
    stripIndents`Expense doesn't belong to Roof`
  ),
  transferDoesntBelong: new InternalServerError(
    stripIndents`Transfer doesn't belong to Roof`
  ),
  settlementDoesntBelong: new InternalServerError(
    stripIndents`Settlement doesn't belong to Roof`
  ),
  incorrectSplit: new InternalServerError(
    stripIndents`Expense values not split correctly.`
  ),
  cantEditALeasesTimestampAndTimestampComponentsSeperately: new InternalServerError(
    stripIndents`A leases timestamp and timestamp components must be editted together.`
  ),
  jobFailed: new InternalServerError("Job failed"),
  custom: message => new InternalServerError(message)
};
