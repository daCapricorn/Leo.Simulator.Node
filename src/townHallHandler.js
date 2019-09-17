
import {utilities} from '../shared';
const { tryParseJson} = utilities;
import o from './logWebUi';
import {validateRemoteAttestationVrf} from './remoteAttestation';
import {constValue} from '../shared';
const {ComputeTaskRoles} = constValue;
import {computeTaskOwnerConfirmationDone, sendComputeTaskRaDone} from './computeTask'

exports.peerJoined = (peer)=>{
  console.log(`peer ${peer} joined`);
  // console.log('peer join event');
  // if(typeof global.allPeers[peer] == 'undefined'){
      
  //   global.rpcEvent.emit('rpcRequest', {
  //     sendToPeerId:peer,
  //     message:JSON.stringify({type:'ping', userInfo:global.userInfo}),
  //     responseCallBack:(res, err)=>{
  //       if(err){
  //         o('error', 'Ping another peer got err:', err);
  //       }
  //       else{
  //         const {type, userInfo} = res;
  //         console.assert(type == 'pong');
  //         o('debug', `I receive a pong from peer ${peer}, userInfo added to my peer list,`, userInfo)
            
  //         global.allPeers[peer] = userInfo;
  //       }
  //     }
  //   });
  //   console.log(`peer ${peer} joined. userInfo request sent`)
  // }
  // else
  //   console.log(`peer ${peer} joined. I have him into peer list`);
};
exports.peerLeft = (peer)=>{
  // if(global.allPeers[peer]){
  //   console.log(`peer ${peer} left. His userinfo:`, global.allPeers[peer].userInfo);
  //   delete global.allPeers[peer];
  // }
  // else
    console.log(`peer ${peer} left`);
};
exports.subscribed = (m)=>console.log(`Subscribed ${m}`);
const updateLog = ()=>{};

exports.rpcDirect = (message) => {
  //o('log', 'In townhall got RPC message from ' + message.from + ': ', message);
  if(! message.guid || ! message.verb)
    return console.log("twonHall RPC handler got a message not standard RPC,", message);
  const messageObj = tryParseJson(message.data.toString());
  if(! messageObj)
    return console.log("townHallMessageHandler received non-parsable message, ", messageString);
  
  const handlerFunction = rpcDirectHandler[messageObj.type];
  try {
      if(typeof handlerFunction == 'function'){
      handlerFunction({from:message.from, guid:message.guid, messageObj});
      return
    }
    else{
      return console.log("townHallMessageHandler received unknown type message object,", messageObj );
    }
  }
  catch(e){
    return console.error('executing handlerFunction inside townhall has exception:', e);
  }
}

exports.rpcResponseWithNewRequest = (room)=>(args)=>{
  const {sendToPeerId, message, guid, responseCallBack, err} = args;
  room.rpcResponseWithNewRequest(sendToPeerId, message, guid, responseCallBack, err);
}
exports.rpcRequest = (room)=>(args)=>{
  const {sendToPeerId, message, responseCallBack} = args;
  room.rpcRequest(sendToPeerId, message, responseCallBack);
}
exports.rpcResponse =  (room)=>(args)=>{
  const {sendToPeerId, message, guid, err} = args;
  //o('debug', 'inside exports.rpcResponse:', sendToPeerId, message, guid, err);
  room.rpcResponse(sendToPeerId, message, guid, err);
}

exports.messageHandler = (message)=>{
  const command = tryParseJson(message.data.toString());
  if(! command){
    o('debug', 'unhandled townhall message', message);
    return;
  }
  switch(command.txType){
    case 'debug_showPeerMgr':{
      global.nodeSimCache.computeTaskPeersMgr.debugOutput();
      break;
    }
    // case 'debug_rpcAllPeers':{
    //   global.ipfs.swarm.peers((err, peersAddresses) => {
    //     if (err) {
    //       callback(err)
    //       return // early
    //     }
    //     console.log('From debug_rpcAllPeers display my peersAddress:', peersAddresses.map(p=>p.peer._idB58String));
    //     console.log('My peerId is,', global.ipfs._peerInfo.id.toB58String());
    //   });
    //   break;
    // }
    default:
      o('debug', 'unhandled townhall message', command);
  }
}

