

import o from './logWebUi';
import {constValue} from '../shared';
const {expectNumberOfRemoteAttestatorsToBeVoted, minimalNewNodeJoinRaDeposit, 
  expectNumberOfExecutorGroupToBeVoted, ComputeTaskRole} = constValue;
const {ComputeTaskRoles} = constValue;

import Big from 'big.js';
import {sha256} from 'js-sha256';
const {ecvrf, sortition} = require('vrf.js');
import {validatePot} from './remoteAttestation';
import ComputeTaskPeersMgr from './nodeSimComputeTaskPeersMgr';

exports.handleProccessedTxs = async ({height})=>{
   
  
  const {userInfo} = global;
  if(! userInfo){
    o('log', 'userInfo is not initialized yet. Probably new block comes before "requestUserInfo" in the townHallJoinHandler. we will skip this block, waiting for next');
    return;
  }

  const blockCid = global.blockMgr.getBlockCidByHeight(height);
  const block = (await global.ipfs.dag.get(blockCid)).value;

  const newNodeJoinNeedRaTxsCid = [];
  const remoteAttestationDoneTxsCid = [];
  const uploadLambdaTxsCid = [];
  const computeTaskTxsCid = [];
  const computeTaskWinnerApplicationCid = [];

  block.processedTxs.forEach((tx)=>{
    if(tx.txType == 'newNodeJoinNeedRa')  newNodeJoinNeedRaTxsCid.push(tx.cid);
    if(tx.txType == 'remoteAttestationDone')  remoteAttestationDoneTxsCid.push(tx.cid);
    if(tx.txType == 'uploadLambda')  uploadLambdaTxsCid.push(tx.cid);
    if(tx.txType == 'computeTask')  computeTaskTxsCid.push(tx.cid);
    if(tx.txType == 'computeTaskWinnerApplication') computeTaskWinnerApplicationCid.push(tx.cid);
  });
  newNodeJoinNeedRaTxsCid.map(async (txCid)=>{
    const tx = (await global.ipfs.dag.get(txCid)).value;
    const userInfo = global.userInfo;
    console.log('try ra task', userInfo, tx);
    const reqRaObj = handleNewNodeJoinNeedRaTxs({block, blockCid, totalCreditForOnlineNodes: block.totalCreditForOnlineNodes, tx, txCid, userInfo});
    const handleRaResponse = async (res, err)=>{
      if(err){
        o('log', `I am a Remote Attestator, I received new node's error response :, err is `, err);
        return console.log(`I am a Remote Attestator, I received new node's error response :, err is `, err);
      }
      o('log',`I am a Remote Attestator, I received new node's reply :, payload is `, res);
      o('status', ' I am a Remote Attestator. I have received new nodes PoT');
      const {proofOfVrf, proofOfTrust} = res;
      const potResult = validatePot(proofOfTrust);
      o('log', `Proof of trust verify result: ${potResult}`);
      const cid = await global.ipfs.dag.put({potResult,proofOfTrust,proofOfVrf});
      const remoteAttestationDoneMsg = {
        txType:'remoteAttestationDone',
        cid: cid.toBaseEncodedString()
      }
      global.broadcastEvent.emit('taskRoom', JSON.stringify(remoteAttestationDoneMsg));
      o('log', `Broadcast in taskRoom about the Proof of trust verify result: ${potResult}`);
      o('status', `I have completed RA task. The new node is ${potResult? "good" : "bad"}`);
    }
    if(reqRaObj){
      global.rpcEvent.emit('rpcRequest', {
        sendToPeerId:tx.ipfsPeerId, 
        message:JSON.stringify(reqRaObj), 
        responseCallBack:handleRaResponse
      });
      o('log', `Sending townhall request to the new node: ${tx.ipfsPeerId}  for RA:`, reqRaObj);
      o('status', 'I am asking new node for PoT');
    }else{
      console.log("reqRaObj is null");
    }
  });
  
  remoteAttestationDoneTxsCid.map((cid)=>{
    
  });

  uploadLambdaTxsCid.map((cid)=>{
    //console.log("for upload Lamdba, we do not need to do anything. Just have a record there that in which block height, the CID of this ladba has been recorded. In case of some future search")
  });
  
  computeTaskTxsCid.map(async (cid)=>{
    global.nodeSimCache.computeTaskPeersMgr.addNewComputeTask(cid);
    const mySpecialRole = await global.nodeSimCache.computeTaskPeersMgr.assignSpecialRoleToTask(cid, global.userInfo.userName);
    if(mySpecialRole){
      return o('debug', `I am the ${mySpecialRole} in this task cid ${cid} myself, I cannot do execution compute task on myself`);
    };
    //o('debug', 'I will check the task first, make sure it is not faked');
    
    const {depositAmt, executorRequirement} = (await ipfs.dag.get(cid)).value;

    if(depositAmt < 0){
      o('log', `amt has to be greater than 0, otherwise he is stealing money from you: ${tx.value.depositAmt}. computTask abort now`);
      return;
    }
    const myCurrentGasBalance = block.gasMap[userInfo.userName];
    
    if ( myCurrentGasBalance < depositAmt){
      o('log', "I do not have enough gas as escrow to start this compute task. I have to quit this competition. Sorry. ")
      return;
    }
    const myCurrentCreditBalance = block.creditMap[userInfo.userName];
    if ( myCurrentCreditBalance < executorRequirement.credit){
      o('log', `My credit balance is ${myCurrentCreditBalance} which is lower than the task client required ${executorRequirement.credit}. I have to quit this competition. Sorry. `);
      return;
    }
    //o('debug', 'I passed the basic verify of the new compute task. i will start try vrf');
    const vrfResult = ComputeTaskPeersMgr.tryVrfForComputeTask(block, cid, userInfo);
    if(vrfResult.result){
      o('log', `I am lucky!! J is ${vrfResult.j}. However I should not tell anyone about my win. Do not want to get hacker noticed. I just join the secure p2p chat group for winner's only`);
      o('status', `I won VRF of compute task. J value is ${vrfResult.j}`);
      const applicationJoinSecGroup = {
        txType:'computeTaskWinnerApplication',
        ipfsPeerId: global.ipfs._peerInfo.id.toB58String(),//peerId for myself
        userName: userInfo.userName,
        taskCid: cid,
        blockHeightWhenVRF: block.blockHeight
      };
    
      global.broadcastEvent.emit('taskRoom', JSON.stringify(applicationJoinSecGroup));
      o('log', `I am asking to join the secure chatting group by sending everyone in this group my application`, applicationJoinSecGroup);
      global.nodeSimCache.computeTaskPeersMgr.addMyVrfProofToTask(cid, vrfResult);
      global.nodeSimCache.computeTaskPeersMgr.setExecutorPeer(cid,  global.ipfs._peerInfo.id.toB58String());//first set myself to be the executor, then it may change if other peer send me their J and random
      global.nodeSimCache.computeTaskPeersMgr.debugOutput(cid);
    }else{
      o('log', `bad luck, try next time`);
      o('status', 'bad luck. Did not win VRF. Try next time');
    }
    
  });

  computeTaskWinnerApplicationCid.map(async (cid)=>{
    /****
     * 
     * At thi moment, we do not do anything. Because in the pendingTask section we will go through the 
     * full list of applicator, asking them the proof of VRF using rpcRequest
     */
  })
}

const handleNewNodeJoinNeedRaTxs = ({block, blockCid, totalCreditForOnlineNodes, tx, txCid, userInfo})=>{
  const myCurrentCreditBalance = block.creditMap[userInfo.userName];
  const myCurrentGasBalance = block.gasMap[userInfo.userName];
  
  if(tx.userName == userInfo.userName){
    console.log("I am the node myself, I cannot do remote attestation on myself, skip");
    return;
  }
  if(tx.depositAmt < minimalNewNodeJoinRaDeposit){
    console.log(`The new node did not pay enough gas to do the RA, he has paid ${tx.depositAmt}. Remote attestation abort now`);
    return;
  }
      
  if ( myCurrentGasBalance < tx.depositAmt){
    o('log', "I do not have enough gas as escrow to start this remote attestation. I have to quit this competition. Sorry. ")
    return;
  }
  if ( myCurrentCreditBalance == 0){
    o('log', "My credit balance is 0. I have to quit this competition. Sorry. ");
    return;
  }
  const vrfMsg = sha256.update(blockCid).update(txCid).hex();

  const p = expectNumberOfRemoteAttestatorsToBeVoted / totalCreditForOnlineNodes;
  const { proof, value } = ecvrf.vrf(Buffer.from(userInfo.publicKey, 'hex'), Buffer.from(userInfo.privateKey, 'hex'), Buffer.from(vrfMsg, 'hex'));
  console.log("VRF{ proof, value }", { proof:proof.toString('hex'), value: value.toString('hex') });
  console.log("Now running VRF sortition...it also needs some time... please be patient...", myCurrentCreditBalance, p);
  const j = sortition.getVotes(value, new Big(myCurrentCreditBalance), new Big(p));
  if(j.gt(0)){
    console.log("I am lucky!!! J:", j.toFixed());
    o('status', `I won VRF of New Node Join RA. J value is ${j.toFixed()}`);
    const raReqObj = {
      type:'reqRemoteAttestation',
      j:parseInt(j.toFixed()), 
      proof: proof.toString('hex'), 
      value: value.toString('hex'),
      blockHeightWhenVRF: block.blockHeight,
      taskCid:txCid,
      publicKey:userInfo.publicKey,
      userName:userInfo.userName,
      blockCid
    }

    return raReqObj;
    
  }else{
    console.log("bad luck, try next", j.toFixed());
    o('status', 'bad luck, did not win VRF. try next time')
    return null;
  }

}
exports.handleNewNodeJoinNeedRaTxs = handleNewNodeJoinNeedRaTxs;
