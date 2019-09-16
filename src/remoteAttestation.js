
const {minimalNewNodeJoinRaDeposit, expectNumberOfRemoteAttestatorsToBeVoted, expectNumberOfExecutorGroupToBeVoted} = require( '../shared/constValue');

const {sha256} = require( 'js-sha256');
const { ecvrf, sortition} = require( 'vrf.js');
const Big = require( 'big.js');

const _verifyVrf = async (j, proof, value, blockCid, taskCid, publicKey, userName, numberOfCommitee)=>{
  if(!j || !proof || !value || !blockCid || !taskCid || !publicKey || !numberOfCommitee){
    return {
      result:false, 
      reason:`The incoming message missing some properties: ${JSON.stringify({j, proof, value, blockCid, taskCid, publicKey, userName})}`
    };
  }
  const block = (await ipfs.dag.get(blockCid)).value;

  const totalCreditForOnlineNodes = block.totalCreditForOnlineNodes;

  const vrfMsg = sha256.update(blockCid).update(taskCid).hex();
  
  const p =  numberOfCommitee/ totalCreditForOnlineNodes;
  
  const vrfVerifyResult = ecvrf.verify(Buffer.from(publicKey, 'hex'), Buffer.from(vrfMsg, 'hex'), Buffer.from(proof, 'hex'), Buffer.from(value, 'hex'));
  if(! vrfVerifyResult){
    return {result: false, reason:'VRF verify failed'};
  }
  const remoteAttestatorCreditBalance = block.creditMap[userName];
  console.log('remoteAttestatorCreditBalance', remoteAttestatorCreditBalance);
  const jVerify = sortition.getVotes(Buffer.from(value, 'hex'), new Big(remoteAttestatorCreditBalance), new Big(p));
  if(jVerify.toFixed() != j){
    console.log("vrf soritition failed,", jVerify.toFixed());
    return {result: false, reason:'VRF Sortition failed'  + jVerify.toFixed()};
  }
  return {result:true};
};

module.exports.validateRemoteAttestationVrf = ({j, proof, value, blockCid, taskCid, publicKey, userName})=>{
  try{
    return _verifyVrf(j, proof, value, blockCid, taskCid, publicKey, userName, expectNumberOfRemoteAttestatorsToBeVoted);
  }
  catch(e){
    return {result: false, reason:`_verifyVrf has exception:`, e};
  }
  
};

module.exports.validateComputeTaskVrf = async ({j, proof, value, blockCid, taskCid, publicKey, userName})=>{
  await _verifyVrf(j, proof, value, blockCid, taskCid, publicKey, userName, expectNumberOfExecutorGroupToBeVoted);
};

module.exports.validatePot = (proofOfTrust)=>{
  const {psrData, isHacked, tpmPublicKey} = proofOfTrust;

  return ! isHacked;
}

