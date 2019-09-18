import o from './logWebUi';
const Docker = require('../docker');
const {crypto, cache} = require('../shared/utilities');

module.exports.executeCompute = (taskCid)=>{
  //this is just a place holder, in the real system, we should launch docker and run the command to get the result.
  //Now we just return hello world
  const computeTaskBuffer = {};//We use this buffer to store the params data from task owner, and code from lambda owner. then run execute task
  
  const taskOwnerPeerId = global.nodeSimCache.computeTaskPeersMgr.getTaskOwnerPeer(taskCid);
  const lambdaOwnerPeerId = global.nodeSimCache.computeTaskPeersMgr.getLambdaOwnerPeer(taskCid);

  if(! taskOwnerPeerId || ! lambdaOwnerPeerId){
    //o('error', 'either task owner or lambda owner is not online. computing cannot start. abort');
   throw 'either task owner or lambda owner is not online. computing cannot start. abort' + JSON.stringify({ taskOwnerPeerId, lambdaOwnerPeerId});
  }
  const reqTaskParams = {
    type:'reqTaskParams',
    taskCid,
    blockHeight:global.blockMgr.getLatestBlockHeight()
  };  

  const reqLambdaParams = {
    type:'reqLambdaParams',
    taskCid,
    blockHeight:global.blockMgr.getLatestBlockHeight(),
    public_key: crypto.getPublicKey()
  };
  const reqTaskParamsResponseHandler = async (res, err)=>{
    // TODO
    if(err){
      o('error', `I have got the task data from task owner but it is an error, ` +  err);
      return;
    }
    o('log', 'receiving response from task owner for task params:' + res);
    o('status', 'I received data from task owner');
    const {data, taskCid} = res;
    console.log('data, ', data);
    console.log(`I have got the task data from task owner, `, data);
    
    computeTaskBuffer[taskCid] = computeTaskBuffer[taskCid] || {};
    if(computeTaskBuffer[taskCid].data){
      throw `Error, executor has got the data already, why a new data come up again?`+  JSON.stringify({data, buffer: computeTaskBuffer});
      
    }

    computeTaskBuffer[taskCid].data = data;
    const result = await executeIfParamsAreReady(computeTaskBuffer, taskCid);
    if(result){
      o('status', 'I have completed the compute task. Result is:' + result + ' Waiting for verification from task owner and monitors')
      sendComputeResultBackToTaskOwner(taskCid, result);
      sendComputeExecutionDoneToMonitor(taskCid);
      sendComputeTaskExecutionDone(taskCid);
    }
  };

  global.rpcEvent.emit('rpcRequest', {
    sendToPeerId: taskOwnerPeerId,
    message: JSON.stringify(reqTaskParams),
    responseCallBack: reqTaskParamsResponseHandler
  });

  o('status', 'I am asking task owner for data');
  
   
  console.log(`Sending request for task data to taskOwner: PeerId:${taskOwnerPeerId}`, reqTaskParams)
  
  const reqLambdaParamsHandler = async (res, err)=>{
    if(err){
      o('error',  `I have got the task lambda from task owner but it is an error, ` +  err);
      return;
    }
    o('log', 'receiving response from lambda owner for code:' + res);
    o('status', 'I have received lambda owner code');
    const {cid, taskCid} = res;
    console.log('code, ', cid);
    console.log(`I have got the lambda code from lambda owner, `, cid);
    computeTaskBuffer[taskCid] = computeTaskBuffer[taskCid] || {};
    
    if(computeTaskBuffer[taskCid].code){
      throw `Error, executor has got the code already, why a new code come up again?` +  JSON.stringify({code:cid, buffer: computeTaskBuffer});
      
    }

    computeTaskBuffer[taskCid].code = cid;
    //TODO
    computeTaskBuffer[taskCid].data = res;
    console.log('computeTaskBuffer', computeTaskBuffer);
    const result = await executeIfParamsAreReady(computeTaskBuffer, taskCid);
    if(result){
      sendComputeResultBackToTaskOwner(taskCid, result);
      sendComputeExecutionDoneToMonitor(taskCid);
      sendComputeTaskExecutionDone(taskCid);
    }
  };

  global.rpcEvent.emit('rpcRequest', {
    sendToPeerId: lambdaOwnerPeerId,
    message: JSON.stringify(reqLambdaParams),
    responseCallBack: reqLambdaParamsHandler
  });
  o('status', 'I am asking lambda owner for code');
  console.log(`Sending request for lambda function code to lambda Owner PeerId:${lambdaOwnerPeerId}`, reqLambdaParams);
}

const executeIfParamsAreReady = async (computeTaskBuffer, taskCid)=>{
  if(computeTaskBuffer[taskCid].data && computeTaskBuffer[taskCid].code){
    o("status", 'I am executing the compute task now...');
    computeTaskBuffer[taskCid].taskCid = taskCid;
    console.log(`Executor has got both data and code, it can start execution`, computeTaskBuffer[taskCid])
    const result = await executeComputeUsingEval(computeTaskBuffer[taskCid]);
    delete computeTaskBuffer[taskCid];
    console.log( `Execution result:`, result);
    return result;
  }
  return null;
}

const sendComputeResultBackToTaskOwner = (taskCid, result)=>{
  const taskOwnerPeerId = global.nodeSimCache.computeTaskPeersMgr.getTaskOwnerPeer(taskCid);
  const reqComputeCompleted = {
    type: 'reqComputeCompleted',
    taskCid,
    result
  };
  const reqComputeCompletedCallBack = (res, err)=>{
    if(err){
      o('error', 'reqComputeCompleted get error response from taskOwner. err:', err);
    }
    if(res){
      o('debug', 'I am executor. I have completed the compute task. i got this result from task owner:', res);
      o('status', 'I am executor, I received certificate from task owner');
    }
  };
  global.rpcEvent.emit('rpcRequest', {
    sendToPeerId: taskOwnerPeerId,
    message:JSON.stringify(reqComputeCompleted),
    responseCallBack: reqComputeCompletedCallBack
  })
  o('debug', `I have done the task execution. i send reqComputeComplete to the task owner peer:${taskOwnerPeerId}, waiting for response.`);
  o('status', 'I am executor, I am sending back the compute result to task owner');
};

const sendComputeExecutionDoneToMonitor = (taskCid)=>{
  const monitorsPeers = global.nodeSimCache.computeTaskPeersMgr.getPeersInGroup(taskCid);
  o('debug', 'monitorsPeers is,', monitorsPeers);
  const reqComputeCompleted = {
    type: 'reqComputeCompleted',
    taskCid
  };
  const reqComputeCompletedFromMonitorCallBack = (res, err)=>{
    if(err){
      o('error', 'reqComputeCompleted get error response from remote attestator. err:', err);
    }
    if(res){
      o('debug', 'I am executor. I have completed the compute task. i got this result from my remote attestator:', res);
      o('status', 'I am executor, I received certificate from monitor');
    }
  };
  for(let sendToPeerId of monitorsPeers){
    global.rpcEvent.emit('rpcRequest', {
      sendToPeerId,
      message:JSON.stringify(reqComputeCompleted),
      responseCallBack: reqComputeCompletedFromMonitorCallBack
    });
    o('debug', `I have done the task execution. i send reqComputeComplete to my monitor peer:${sendToPeerId}, waiting for response.`);
  };
  
};
module.exports.sendComputeTaskRaDone = (taskCid, raResult=true)=>{
  const computeTaskRaDoneObj = {
    txType:'computeTaskRaDone',
    monitorUserName: global.userInfo.userName,
    executorName: global.nodeSimCache.computeTaskPeersMgr.getExecutorName(taskCid),
    taskCid,
    myVrfProof:global.nodeSimCache.computeTaskPeersMgr.getMyVrfProofInfo(taskCid),
    raResult
  }
  global.broadcastEvent.emit('taskRoom', JSON.stringify(computeTaskRaDoneObj));
  o('status', ' I am monitor. I confirmed that computer ra task done');
}

module.exports.computeTaskOwnerConfirmationDone = (taskCid, result = true)=>{
  const computeTaskOwnerConfirmationDoneObj = {
    txType:'computeTaskOwnerConfirmationDone',
    taskOwnerName: global.userInfo.userName,
    executorName: global.nodeSimCache.computeTaskPeersMgr.getExecutorName(taskCid),
    taskCid,
    result
  }
  global.broadcastEvent.emit('taskRoom', JSON.stringify(computeTaskOwnerConfirmationDoneObj));
  o('log', 'computer computeTaskOwnerConfirmationDone. send out broadcast in taskRoom');
  o('status', 'I am task owner. i confirmed task completed.')
}


const sendComputeTaskExecutionDone = (taskCid)=>{


  const computeTaskDoneObj = {
    txType:'computeTaskExecutionDone',
    executorName: global.userInfo.userName,
    taskCid,
    myVrfProof:global.nodeSimCache.computeTaskPeersMgr.getMyVrfProofInfo(taskCid),
    
  }
  global.broadcastEvent.emit('taskRoom', JSON.stringify(computeTaskDoneObj));
  o('log', 'computer task done. send out broadcast in taskRoom');
  o('status', ' I am executor. I confirmed that computer ra task done');
}
// const chooseExecutorAndMonitors = (task)=>{
//   let executor;
//   let maxJ = 0;
//   for(var i =0; i < task.followUps.length; i ++){
//     if ( parseInt(task.followUps[i].j) > maxJ){ //first come first server. If there are more than one member has the same highest J, the first is the winner. based on the block record
//       executor = task.followUps[i];
//       maxJ = parseInt(task.followUps[i].j);
//     }
//   }
//   return executor;
// }
// exports.chooseExecutorAndMonitors = chooseExecutorAndMonitors;

const executeComputeUsingEval = async (param)=>{
  const r = await getLambdaValueFromTaskCid(param.data);
  if(r){
    return r;
  }
  
  throw 'execute error';
  // return '';
}
module.exports.executeComputeUsingEval = executeComputeUsingEval;

const getLambdaValueFromTaskCid = async (data)=>{
  const source_data_encrypto = (await ipfs.dag.get(data.cid)).value;
  const key = crypto.privateDecrypt(data.secret_key, crypto.getPrivateKey());
  const source_data = crypto.decrypt(source_data_encrypto, key);

  console.log(11, source_data.length);
  if(data.dockerImg === 'test') return 'Hello World';

  if(data.dockerImg === 'image'){
    const docker = new Docker();
    const rs = docker.run({
      type : 'image',
      code : source_data
    });

    return rs;
  }

  return false;
}

