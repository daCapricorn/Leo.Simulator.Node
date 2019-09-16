module.exports.thresholdForVrfRa = 10;
module.exports.totalCreditToken = 1000;
module.exports.gasFaucetPeerId = 'faucet';
module.exports.gasBurnPeerId = 'fireplace';
module.exports.creditRewardToEverySuccessfulRa = 1;
module.exports.creditPentaltyToEverySuccessfulRa = 1;
module.exports.minimalNewNodeJoinRaDeposit = 10;
module.exports.minRemoteAttestatorsToPassRaTask = 2;
module.exports.expectNumberOfRemoteAttestatorsToBeVoted = 10;
module.exports.initialCreditIssuedWhenPassRa = 10;
module.exports.awardCreditWhenRaSuccessful = 1;
module.exports.penaltyCreditWhenRaFail = 1;
module.exports.reduceFactualIfRaFail = 0.5;
module.exports.expectNumberOfExecutorGroupToBeVoted = 10;
module.exports.minBlockDelayRequiredBeforeComputeStart = 1;
module.exports.mBlockDelayRequiredBeforeComputeStart = 3;
module.exports.minComputeGroupMembersToStartCompute = 2;
module.exports.maxBlockDelayRequiredBeforeComputeStart = 3;
module.exports.howManyBlockToWaitAfterComputeTaskCompletedBeforeForceSettlement = 2;
module.exports.creditRewardToExecutorAfterSuccessfulComputeTask = 5;
module.exports.creditPenaltyToExecutorAfterFailedComputeTask = 5;
module.exports.creditRewardToMonitorAfterSuccessfulComputeTask = 1;
module.exports.creditPenaltyToMonitorAfterFailedComputeTask = 1;

module.exports.ComputeTaskRoles = {
  taskOwner:'taskOwner',
  lambdaOwner:'lambdaOwner',
  executeGroupMember:'executeGroupMember'
}
module.exports.tryParseJson = (s)=>{
  try{
    return JSON.parse(s);
  }
  catch(e){
    return undefined;
  }
}
