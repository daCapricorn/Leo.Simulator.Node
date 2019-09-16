
import {utilities} from 'leo.simulator.shared';
const { tryParseJson} = utilities;
import o from './logWebUi';
import {remoteAttestation}  from 'leo.simulator.shared';
const {validateRemoteAttestationVrf} = remoteAttestation;
import {constValue} from 'leo.simulator.shared';
const {ComputeTaskRoles} = constValue;
import {computeTask} from 'leo.simulator.shared';
const {computeTaskOwnerConfirmationDone, sendComputeTaskRaDone} = computeTask;

exports.ping = ({from, message, callbacks})=>{
  o('debug', `I receive another peer ${from} ping. I response my userInfo`);
  const {userInfo, specialRole} = message;
  if(userInfo){
    global.allPeers[from] = userInfo;
    o('debug', `I receive a ping from peer ${from} with his userInfo added to my peer list,`, userInfo);
  } 
  else if(specialRole == 'WebUi'){
    global.webUiPeerId = from;
    global.allPeers[from] = {specialRole};
    o('debug', `I receive a ping from WebUi peer ${from}, He has a special role,`, specialRole);           
  }
  else if(specialRole == 'LayerOneBlockChain'){
    global.allPeers[from] = {specialRole};
  }
  else{
    //Pinger did not send his userInfo or Special Role
  }
  if(global.userInfo){
    const resMessage = {
      type:'pong',
      userInfo:global.userInfo
    };
    callbacks.rpcResponse({resMessage});
    
  }else{
    callbacks.rpcResponse({err: 'I have not got a user name from layer one yet. i will update you when I have one'});
  }
  
  if(! global.allPeers[from]){
    o('debug', `this user is not in my peer list. after pong my user info, I am requesting him a ping for his userinfo`);
    const responseCallBack = (res, err)=>{
      if(err){
        o('error', 'Ping another peer got err:', err);
      }
      else{
        const {type, userInfo, specialRole} = res;
        console.assert(type == 'pong');
        if(userInfo){
          global.allPeers[from] = userInfo;
          o('debug', `I receive a pong from peer ${from}, userInfo added to my peer list,`, userInfo);
        } 
        else if(specialRole == 'WebUi'){
          global.webUiPeerId = from;
          global.allPeers[from] = {specialRole};
          o('debug', `I receive a pong from peer ${from}, He has a special role,`, specialRole);           
        }
        else if(specialRole == 'LayerOneBlockChain'){
          global.allPeers[from] = {specialRole};

        }
      }
    }
    callbacks.rpcResponse({resMessage: {type:'ping'}, responseCallBack});
  }
};
exports.reqUserInfo = ({from, callbacks})=>{
  const resMessage = {
    type:'requestRandomUserInfo',
  };
  
  const responseCallBack = (res, err)=>{
    console.log("got response of randomuserinfo")
    if(err)
      console.log("rpcResponseWithNewRequest err,",err);
    else{
      const {userInfo} = res;
      if(! userInfo){
        o('error', 'cannot find userinfo from requestRandomUserInfo response. probably all users are online. No need for more terminal');
      }else{

        global.userInfo = {
          userName: userInfo.name,
          publicKey: userInfo.pub,
          privateKey: userInfo.pri,
          peerId:global.ipfs._peerInfo.id.toB58String()
        };
        console.log("User info confirmed:", global.userInfo);
        const {privateKey, peerId, ...userInfoToWebUi} = global.userInfo;
        if(global.webUiPeerId){
          global.rpcEvent.emit('rpcRequest', {
            sendToPeerId: global.webUiPeerId,
            message: JSON.stringify({type:'updateNodeUserInfo', userInfo:userInfoToWebUi}),
            responseCallBack:(res, err)=>{
              if(err) o('error', 'Send updateNodeUserInfo to WebUi, but got err response,', err);
            }
          });
          console.log('sending updateNodeUserInfo to webUi.')
        }
        else{
          console.log('global.webUiPeerId not existing. Once global.webUiPeerid received, another userInfo will be sent to WebUi');
        }
      }
    }
  };
  callbacks.rpcResponseWithNewRequest({resMessage, responseCallBack});
  o('log', `send back reqUserInfo to townhall manager using RPC response`, resMessage);
};
exports.simulatorRequestAction = async ({from, message, callbacks})=>{

  console.log('from simulator request action,', message);

  const {txType, ...cidObj} = { ...message.action};
  switch(txType){
    case 'newNodeJoinNeedRa':
      cidObj.ipfsPeerId = ipfs._peerInfo.id.toB58String();
      break;
  }
  
  const cid = (await global.ipfs.dag.put(cidObj)).toBaseEncodedString();

  if(txType === 'computeTask'){
    global.nodeSimCache.computeTaskPeersMgr.addNewComputeTask(cid);
    await global.nodeSimCache.computeTaskPeersMgr.assignSpecialRoleToTask(cid, global.userInfo.userName);
  }

  global.broadcastEvent.emit('taskRoom', JSON.stringify({txType, cid}));
  o('status', `Tx ${txType} sent.`)
  callbacks.rpcResponse({resMessage:{result:'ok'}});
  console.log("send back to simulatorRequestAction requestor:")
};


exports.reqRemoteAttestation = async ({from, message, callbacks})=>{//Now I am new node, sending back poT after validate the remote attestation is real
  const { j, proof, value, taskCid, publicKey, userName, blockHeightWhenVRF} = message;
  const validateReturn = await validateRemoteAttestationVrf({j, proof, value, blockCid:global.blockMgr.getBlockCidByHeight(blockHeightWhenVRF), taskCid, publicKey, userName});

  if(! validateReturn.result){
    o('log', `VRF Validation failed, reason is `, validateReturn.reason);
    return;
  }
  o('log', `VRF Validation passed`);
  const proofOfTrust = {
    psrData:'placeholder',
    isHacked:false,
    tpmPublicKey:'placeholder'
  }
  const resRemoteAttestationObj = {
    type:'resRemoteAttestation',
    proofOfVrf:message,
    proofOfTrust
  }
  callbacks.rpcResponse({resMessage: resRemoteAttestationObj});
  
  o('log', `send back resRemoteAttestation to the remote attestator ${from}, payload is `, resRemoteAttestationObj);
  return;
};

exports.reqTaskParams= ({from, message, callbacks})=>{
  console.log('I have got a request for reqTaskParams, message', message);
  
  const mayDelayExecuteDueToBlockDelay = (message)=>{
    const {taskCid, blockHeight} = message;
    if(blockHeight <= global.blockMgr.getLatestBlockHeight()){
      //this node is slower than the executor who send me the request. I have to wait till I have such a block to continue;
      try{
        if( global.nodeSimCache.computeTaskPeersMgr.getExecutorPeer(taskCid) != from){
          o('log', `Executor validate fail`);
          return;
        }
        const resMessage = {
          type:'resTaskParams',
          data:['Hello', " World!"],
          taskCid
        };
        callbacks.rpcResponse({resMessage})
        o('log', `Sending response for Task data back to executor.`, resMessage);
      }
      catch(e){
        o('error', 'reqTaskParams handler has exception:', e);
        callbacks.rpcResponse({err:e});   
      }
      
    }else{
      global.blockMgr.reRunFunctionWhenNewBlockArrive(mayDelayExecuteDueToBlockDelay, message);
    }
  }
  mayDelayExecuteDueToBlockDelay(message)
};
exports.reqLambdaParams = ({from, message, callbacks})=>{
  console.log('I have got a request for Lambda Params reqLambdaParams, message', message);
  const mayDelayExecuteDueToBlockDelay = (message)=>{
    
    const {taskCid, blockHeight} = message;
    if(blockHeight <= global.blockMgr.getLatestBlockHeight()){
      try{
        if( global.nodeSimCache.computeTaskPeersMgr.getExecutorPeer(taskCid) != from){
          o('log', `Executor validate fail`);
          return;
        }
        const resMessage = {
          type:'resLambdaParams',
          code:'args[0] + args[1]',
          taskCid
        };
        callbacks.rpcResponse({resMessage})

        o('log', `Sending response for Lambda Params back to executor.`, resMessage);
      }
      catch(e){
        o('error', 'reqLambdaParams handler has exception:', e);
        callbacks.rpcResponse({err:e});
      }
    }else{
      global.blockMgr.reRunFunctionWhenNewBlockArrive(mayDelayExecuteDueToBlockDelay, message);
    }
  }
  mayDelayExecuteDueToBlockDelay(message);
};

exports.reqVerifyPeerVrfForComputeTasks = ({from, message, callbacks})=>{
  //o('debug', `I have got other peer sending me his vrf for compute task and ask mine. `, message)

  const handleReqVerifyPeerReRunable = async (message)=>{
    try{
      //o('debug', 'inside handleReqVerifyPeerReRunable', message);
      if(message.blockHeight > global.blockMgr.getLatestBlockHeight()){
        /******
         * 
         * This mean I have not receive the latest block while others send me the request. I have to wait to new block arrive and rerun this funciton
         */
        o('debug', 'I , ${global.userInfo.userName},  have not receive the latest block while others send me the request. I have to wait to new block arrive and rerun this funciton');
        global.blockMgr.reRunFunctionWhenNewBlockArrive(handleReqVerifyPeerReRunable, message);
        return
      }
      
      
      if(typeof global.nodeSimCache.computeTaskPeersMgr.checkMyRoleInTask(message.taskCid) == 'undefined'){
        o('error', `I, ${global.userInfo.userName},  am  not in the exeuction group of cid`, message.taskCid);
        callbacks.rpcResponse({err:'I , ${global.userInfo.userName}, am not in the execution group. I should not receive this message'});
        return
      }
      let validationResult = false;
      let otherPeerUserName;
      
      if(! validationResult){
        if(global.nodeSimCache.computeTaskPeersMgr.isPeerInGroup(from)){
          validationResult = true;
          otherPeerUserName = "already_in_my_group";
        }
      }
      const {taskCid, myVrfProofInfo:otherPeerVrfProofInfo, myRoleProofInfo: othersRoleProofInfo} = message;
      
      if(validationResult == false){
        const block = await global.blockMgr.getLatestBlock();
        if(block.pendingTasks && block.pendingTasks[taskCid]){
          if(block.pendingTasks[taskCid].initiatorPeerId == from){
            validationResult = true;
            otherPeerUserName = 'taskOwner';
            global.nodeSimCache.computeTaskPeersMgr.setTaskOwnerPeer(taskCid, from);
          }
          else if(block.pendingTasks[taskCid].lambdaOwnerPeerId == from){
            validationResult = true;
            otherPeerUserName = 'lambdaOwner';
            global.nodeSimCache.computeTaskPeersMgr.setLambdaOwnerPeer(taskCid, from);
          }
          else
          validationResult = false;
        }
          
      }
      if(validationResult == false && otherPeerVrfProofInfo){
        console.assert(! othersRoleProofInfo , 'if we start to validate vrf, we shoudl be sure that othersRoleProofInfo is not existing');
        otherPeerUserName = otherPeerVrfProofInfo? otherPeerVrfProofInfo.userName: 'otherPeerVrfProofInfo_is_null';
        const blockCid = global.blockMgr.getBlockCidByHeight(otherPeerVrfProofInfo.blockHeightWhenVRF);
      
        const block = (await global.ipfs.dag.get(blockCid)).value;
        if(global.nodeSimCache.computeTaskPeersMgr.validateOtherPeerVrfProofInfo(taskCid, otherPeerVrfProofInfo, blockCid, block)){
          validationResult = true;
          global.nodeSimCache.computeTaskPeersMgr.addOtherPeerToMyExecutionPeers(taskCid, from, otherPeerVrfProofInfo);
          //o('debug', 'vdalite VRF successful.......')
        }else{
          o('debug', 'vrf validation failed too');
        }
      }
      if(validationResult == false){
        o('error', `Townhall handleReqVerifyPeerReRunable: Validate other peer ${from} information failed. I cannot add him to my list. In the future, I should report 
        this to Layer One because that peer could be a hacker trying to peek who is the VRF winner and plan DDoS attack. 
        At this moment, we do not do anything. In the future, one possible solution is to abort this whole process and do it again 
        after a pentalty to the possible hacker `);
        callbacks.rpcResponse({err:`Response from ${global.userInfo.userName}: validating peer ${from} failed. I cannot add you ${otherPeerUserName}into my list`});
        return;
      }
      
      o('log', `I, ${global.userInfo.userName}, verified another peer ${otherPeerUserName} successfully. I have added him into my execution group`);
      
      const resVerifyPeer = {
        type:'resVerifyPeerVrfForComputeTasks',
        taskCid
      }
      
      switch( global.nodeSimCache.computeTaskPeersMgr.checkMyRoleInTask(taskCid)){
        case ComputeTaskRoles.taskOwner:
          resVerifyPeer.myRoleProofInfo = {
            role:'taskOwner',
            proof:'placeholder'
          };
          break;
        case ComputeTaskRoles.lambdaOwner:
          resVerifyPeer.myRoleProofInfo = {
            role:'lambdaOwner',
            proof:'placeholder'
          };
          break;
        case ComputeTaskRoles.executeGroupMember:
          resVerifyPeer.myVrfProofInfo = global.nodeSimCache.computeTaskPeersMgr.getMyVrfProofInfo(taskCid);
          break;
        default:
          throw "We have to have a role in the executeGroup, a taskOwner, lambdaOwner, or just executeGroupMember, cannot be nothing"
      }
      callbacks.rpcResponse({resMessage: resVerifyPeer})
      o('log', `I, ${global.userInfo.userName}, send back resVerifyPeerVrfForComputeTasks to ${from} userName: ${otherPeerUserName}`);
    
    }
    catch(e){
      const err = 'reqVerifyPeerVrfForComputeTasks: exception inside handleReqVerifyPeerReRunable' + e.toString();
      o('error', err);
      callbacks.rpcResponse({err});      
    }
  }
  handleReqVerifyPeerReRunable(message);
},

exports.eqComputeCompleted = ({from, message, callbacks})=>{
  const {taskCid, result} = message;
  if( ComputeTaskRoles.taskOwner == global.nodeSimCache.computeTaskPeersMgr.checkMyRoleInTask(taskCid)){
    callbacks.rpcResponse({resMessage: {feedback:"Great Job!"}});
    o('status', `I am task Owner. I response executor's request back Great Job`);
    computeTaskOwnerConfirmationDone(taskCid);
    o('debug', 'done: computeTaskOwnerConfirmationDone');
  }
  else if(ComputeTaskRoles.executeGroupMember == global.nodeSimCache.computeTaskPeersMgr.checkMyRoleInTask(taskCid)){
    if(global.nodeSimCache.computeTaskPeersMgr.getExecutorName(taskCid) == global.userInfo.userName){
      /**** I am the executor, i do not need to handle this message */
    }else{
      callbacks.rpcResponse({resMessage: {feedback:"Great Job!"}});
      o('status', `I am monitor. I response executor's request back Great Job`);   
      sendComputeTaskRaDone(taskCid);
    }
  }
  else{
    o('error', 'I should be the task owner to receive reqComputeCompleted reqeust, but I am not. Something must be wrong');
  }
}

