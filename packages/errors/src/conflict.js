const { ConflictError } = require("restify-errors");
const { stripIndents } = require("common-tags");

module.exports = {
  emailTaken: new ConflictError(
    stripIndents`There's already a Roof account with this email.
    
    If the account is yours and you'd like to reset it's password, you can do so in settings, or in the login form.`
  ),
  phoneNumberTaken: new ConflictError(
    stripIndents`There's already a Roof account with this phone number.
    
    If the account is yours and you'd like to reset it's password, you can do so in settings, or in the login form.`
  ),
  leaseExpired: new ConflictError(
    stripIndents`The lease you're trying to join has already expired.
    
    You might want to ask your landlord to make sure the lease is set up correctly, 
    or double-check that you're joining with the right key. Reach out to us if it's still a problem!`
  ),
  invalidPostalCode: new ConflictError(
    stripIndents`Our location service is having trouble finding this postal code.
    
    Reach out to us if you think we've got something wrong. Sorry about that!`
  ),
  invalidAddress: new ConflictError(
    stripIndents`Our location service is having trouble finding this address.
    
    We’ve been notified and will reach out to you about it soon. Sorry about that!`
  ),
  badLoginEmail: new ConflictError(
    stripIndents`We don't recognize this email, maybe there's a typo?
    
    Reach out to us if you think we’ve got something wrong.`
  ),
  badLoginPhoneNumber: new ConflictError(
    stripIndents`We don't recognize this phone number, maybe there's a typo?
    
    Reach out to us if you think we’ve got something wrong.`
  ),
  invitationNotRecognized: new ConflictError(
    stripIndents`We don't recognize this invitation code, maybe there's a typo?
    
    Reach out to us if you think we’ve got something wrong.`
  ),
  rewardNotRecognized: new ConflictError(
    stripIndents`We don't recognize this reward code. Maybe there's a typo, or the person who created the code has deleted it.
    
    Reach out to us if you think we’ve got something wrong.`
  ),
  bankNotFound: new ConflictError(
    stripIndents`This bank doesn't seem to be associated with your account.
    
    Reach out to us if you think we’ve got something wrong. Sorry about that!`
  ),
  unrecognizedPaymentProfile: new ConflictError(
    stripIndents`This bank doesn't seem to be associated with your account.
    
    Reach out to us if you think we’ve got something wrong. Sorry about that!`
  ),
  ///Thrown when a user tries to verify their account with a code different from the one that was sent.
  wrongCode: new ConflictError(
    stripIndents`That code isn't right. Try setting your phone number again to get a new one.
    
    Reach out to us if you think we’ve got something wrong!`
  ),
  cantPay: new ConflictError(
    stripIndents`A payment can't be made because this invoice doesn't have a bank set to deposit the transfer into.
    
    Reach out to us if you think something is wrong.`
  ),
  tempTransferNotAllowed: new ConflictError(
    stripIndents`There is a temporary hold on your account. We’ve been notified and will reach out to you very soon.
    
    Don't worry! This is just a precaution — it doesn't mean anything's wrong. We’re always extra careful when moving large amounts of money around, and this hold is an extra step to make sure everything is secure before your first payment. It should be cleared in a day.`
  ),
  transferNotAllowed: new ConflictError(
    stripIndents`Your account is in a bad state right now. 
    This happens sometimes because we’re extra careful when moving large amount of money around, and something about your payment history on Roof caused our robots to raise an eyebrow.
    
    Reach out to us if you think we've got it wrong.`
  ),
  cantDeleteAccount: new ConflictError(
    stripIndents`Your account is in a bad state right now and can’t be deleted. 
    This happens sometimes because we’re extra careful when moving large amount of money around, and something about your past spending habit on Roof caused our robots to raise an eyebrow.
    
    Reach out to us if you think we've got it wrong.`
  ),
  invitationExpiredRoommate: new ConflictError(
    stripIndents`Looks like this invitation expired. Try asking your roommate for a new one.`
  ),
  invitationExpiredTenant: new ConflictError(
    stripIndents`Looks like this invitation expired. Try asking your landlord for a new one.`
  ),
  invitationExpiredTeammate: new ConflictError(
    stripIndents`Looks like this invitation expired. Try asking your teammate for a new one.`
  ),
  invitationAlreadyUsedRoommate: new ConflictError(
    stripIndents`This invitation has already been used. Try asking your roommate for a new one.`
  ),
  invitationAlreadyUsedTeammate: new ConflictError(
    stripIndents`This invitation has already been used. Try asking your teammate for a new one.`
  ),
  invitationAlreadyUsedTenant: new ConflictError(
    stripIndents`This invitation has already been used. Try asking your landlord for a new one.`
  ),
  leaseLengthTooLong: new ConflictError(
    stripIndents`This lease can't be longer than five years. Try changing the dates.
    
    If you have a reason for needing a longer lease that you think we should know about, reach out and let us know!`
  ),
  codeExpired: new ConflictError(
    stripIndents`This code expired. Try setting your phone number again to get a new one.`
  ),
  tooManyFilesInComment: new ConflictError(
    stripIndents`You can only attach 9 files to a comment. Try deleting some then trying again.`
  ),
  unrecognizedBankAuthorizationLink: new ConflictError(
    stripIndents`This link isn't familiar. Try asking to authorize your bank again by going to your account's banking settings.`
  ),
  unrecognizedEmailVerificationLink: new ConflictError(
    stripIndents`This link isn't familiar. Try asking to verify your email again by going to your account's settings.`
  ),
  unauthorizedPayer: new ConflictError(
    stripIndents`That bank hasn't been authorized to make payments. Request another authorization link in your banking settings.`
  ),
  badPassword: new ConflictError(
    stripIndents`That password could be easy to guess... and nobody wants that to happen. 
    Add at least 8 total letters, numbers, and symbols.`
  ),
  ///TEMP
  addedSlightOfHand: new ConflictError("Added them!"),
  ///DEPRECATED
  creditsUnavailable: new ConflictError(
    stripIndents`You don't have free tenants available. Refer another landlord to earn more.`
  ),
  cantSetThisInvoiceAmount: new ConflictError(
    stripIndents`You can't set the invoice's owed amount to less than what's been paid. Try setting a bigger amount.`
  ),
  cantSetLeaseEndTimestampBeforeInvoiceWithActivity: new ConflictError(
    stripIndents`This lease end date needs to come after all invoices in this lease that have been paid or have active threads. Set the lease start date further in the future.`
  ),
  transferAmountTooLarge: new ConflictError(
    stripIndents`As a security precaution, you can only send $5,000 per transaction. If you need to send more, you can always make another transaction.`
  ),
  instantBankVerificationNotAvailable: new ConflictError(
    stripIndents`Unfortunately, we don't currently support instant verification for this bank.
    
    Try adding this bank using its account number instead. We're sorry about that!`
  ),
  //DEPRECATED
  needsPaymentMethod: new ConflictError(
    stripIndents`You'll need to set up your subscription before inviting a tenant.`
  ),
  ///Thrown when a bank or a document is added when the payment account hasn't been set up yet.
  cantUpdateBankOwnerAccount: new ConflictError(
    stripIndents`You'll need to set up your banking information before you update it.
    
    Reach out if you need a hand.`
  ),
  cantAddInviteToAnExpiredLease: new ConflictError(
    stripIndents`An invitation can't be made to an expired lease.
    
    Try making a new lease, or editing the end date of this one to be further in the future.`
  ),
  invoiceNotYetPayable: new ConflictError(
    stripIndents`This invoice isn't payable yet.
    
    If you want to pay this early, try sending your landlord a message on this thread. They'll be able to adjust the payment window for you if they want.`
  ),
  invoiceNotPayableInParts: new ConflictError(
    stripIndents`This invoice can only be paid in full.
    
    If you want to pay this in parts, try sending your landlord a message on this thread. They'll be able to adjust the setting for you if they want.`
  ),
  emailVerificationRequired: new ConflictError(
    stripIndents`You'll need to verify your email first. Click the link we just sent you and try again.`
  ),
  ///Thrown when a tenant tries to set their expected rent to more than the amount owed on the lease.
  badLoginPassword: new ConflictError(
    stripIndents`This password isn't right, maybe there's a typo?
    
    There is a button to reset your password in settings or in the login form if you need it.`
  ),
  expectedAmountCantExceedOwedAmount: new ConflictError(
    stripIndents`Easy there, don't pay more than what's owed. Try a small amount.`
  ),
  invoicePayingMoreThanOwed: new ConflictError(
    stripIndents`Easy there, don't pay more than what's owed. Try a smaller amount.`
  ),
  landlordIsntVerified: new ConflictError(
    stripIndents`Your landlord still needs to verify their banking account.
    
    You'll be able to pay once they do. Sorry about that!`
  ),
  onlyOneReferralCanBeUsed: new ConflictError(
    stripIndents`You've already used a referral code.
    
    Try sharing your referral code with other landlords to get more free credits.`
  ),
  cantUseOwnCode: new ConflictError(
    stripIndents`Nice try. You can't use your own reward code.`
  ),
  ///Thrown when a reward accepter tries to use the same code more than once.
  codeAlreadyUsed: new ConflictError(
    stripIndents`You've already used this referral code.
    
    Try sharing your own referral code with other landlords to get more free credits.`
  ),
  domainLimitReached: new ConflictError(
    stripIndents`Right now, you can't be in more than 8 Roofs. Let us know if you need more!`
  ),
  paymentProfileLimitReached: new ConflictError(
    stripIndents`Right now, you can't have more than 6 payment profiles. Let us know if you need more!`
  ),
  bankLimitReached: new ConflictError(
    stripIndents`Right now, you can't have more than 6 banks. Let us know if you need more!`
  ),
  bankInUse: new ConflictError(
    stripIndents`This bank can't be deleted because it's in use.
    
    Try removing it from the active payment profile using it before deleting it.`
  ),
  cantRevokeJoinedInvite: new ConflictError(
    stripIndents`This invitation can't be revoked since it's already been used.
    
    Let us know if you think we’ve got it wrong.`
  ),
  cantDeleteAcceptedReward: new ConflictError(
    stripIndents`This reward code can't be revoked since it's already been used.`
  ),
  cantUseReferralAfterReceivingAPayment: new ConflictError(
    stripIndents`We only allow new users enter referral codes.
    
    Since you've already begun receiving rent payments on Roof, try sharing your own referral code with other landlords to get free credits.`
  ),
  cantResetBankingWithBank: new ConflictError(
    stripIndents`You still have a bank account attached! Try deleting all bank accounts you've added before resetting your banking information.`
  ),

  //DWOLLA ERRORS
  microdepositsHaveNotSettled: new ConflictError(
    stripIndents`The bank is telling us the small deposits haven’t settled in your bank yet.
    
    Try again when you see them in your account. Thanks for your patience!`
  ),
  microdepositWrongAmounts: new ConflictError(
    stripIndents`The bank is telling us these amounts are incorrect. You only have 3 tries to verify this bank, so guessing isn't a great idea!
    
    If you want to reset the bank on Roof, try deleting it in settings and adding it again.`
  ),
  microdepositInvalidState: new ConflictError(
    stripIndents`The bank is telling us this bank can no longer be verified.
    
    If it is still unverified, try deleting it in settings, waiting 48 hours, then adding it again. We’re sorry about that!`
  ),
  microdepositNotFound: new ConflictError(
    stripIndents`The bank is telling us small deposits haven’t been made to this bank account.
    
    If Roof is still showing the bank as unverified, try deleting it in settings, waiting 48 hours, then adding it again. We’re sorry about that!`
  ),
  microdepositVerifyGenericProblem: new ConflictError(
    stripIndents`The bank is telling us something went wrong while verifying the small deposits.
    
    We’ve been notified and will reach out to you about it. Sorry about that!`
  ),
  microdepositCreateGenericProblem: new ConflictError(
    stripIndents`The bank is telling us something went wrong while issuing small deposits to your account.
    
    We’ve been notified and will reach out to you about it. Sorry about that!`
  ),
  fundingSourceAlreadyAdded: new ConflictError(
    stripIndents`The bank is telling us that the bank information you gave us is wrong, or you’ve already added this bank to your account.
    
    If you’re having trouble with an account that you’ve already added, try deleting the old version before adding it again. 
    Or, reach out to us and we’ll help you with it.`
  ),
  fundingSourceGenericAddingProblem: new ConflictError(
    stripIndents`The bank is telling us that you’re not allowed to add this account right now.
    
    We’ve been notified and will reach out to you about it. Sorry about that!`
  ),
  fundingSourceGenericDeletingProblem: new ConflictError(
    stripIndents`The bank is telling us they’re having trouble deleting this bank.
    
    We’ve been notified and will reach out to you about it. Sorry about that!`
  ),
  customerAddingGenericAddingProblem: new ConflictError(
    stripIndents`The bank is telling us that something went wrong when adding your account.
    
    We’ve been notified and will reach out to you about it. Sorry about that!`
  ),
  customerAddingValidationProblem: ({ bankErrors }) => {
    let text =
      "The bank is telling us that something was missing when adding your account";

    if (bankErrors != undefined) {
      text += `:\n\n${bankErrors}`;
    } else {
      text += ".\n";
    }
    text += "\nReach out to us if you need help with it!";
    new ConflictError(text);
  },
  customerUpdatingValidationProblem: ({ bankErrors }) => {
    let text =
      "The bank is telling us that something was missing when updating your account.";

    if (bankErrors != undefined) {
      text += `:\n\n${bankErrors}`;
    } else {
      text += ".\n";
    }
    text += "\nReach out to us if you need help with it!";
    new ConflictError(text);
  },
  customerUpdatingGenericAddingProblem: new ConflictError(
    stripIndents`The bank is telling us that something went wrong when updating your account.
    
    We’ve been notified and will reach out to you about it. Sorry about that!`
  ),
  chargeCreateGenericAddingProblem: new ConflictError(
    stripIndents`The bank is telling us that something went wrong when making this transfer. Don’t worry, no money was moved away from your account.
    
    We’ll have to take a closer look at what’s going on. We have been notified and will reach out to you. We’re sorry about that!`
  ),
  documentCreateGenericAddingProblem: new ConflictError(
    stripIndents`The bank is telling us that something went wrong when adding this document, or you’ve already uploaded the maximum of 4 documents.
    
    Try adding the file again and make sure it’s less that 10MB in size. Or, reach out to use and we’ll help you with it.`
  ),
  custom: message => new ConflictError(message)
};
