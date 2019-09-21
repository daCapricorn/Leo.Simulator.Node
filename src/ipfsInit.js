import IPFS  from 'ipfs';
import Room from 'ipfs-pubsub-room';
import o from './logWebUi';
import townHallHandler from './townHallHandler';
import blockRoomHandler from './blockRoomHandler';
import rpcResponse from './rpcResponse';
import rpcDirectHandler from './rpcDirectHandler';
import libp2pConfig from './libp2pConfig';
exports.ipfsInit = async (swarmUrlOption)=>{
  console.log('swarmUrlOption:|', swarmUrlOption, '|');
  //const swarmUrl = swarmUrlOption == 'local'? '/ip4/127.0.0.1/tcp/9090/ws/p2p-websocket-star': swarmUrlOption;
  const swarmUrl = swarmUrlOption == 'public'? '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star': swarmUrlOption;
  
  console.log('swarmUrl:|', swarmUrl, '|');
  
  const ipfs = await IPFS.create({
    repo: 'ipfs-storage-no-git/poc/' + Math.random(),
    EXPERIMENTAL: {
      pubsub: true
    },
    config: {
      Addresses: {
        Swarm: [
          //'/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
          //'/ip4/127.0.0.1/tcp/9090/ws/p2p-websocket-star'
          swarmUrl
        ]
      }
    },
    //libp2p:libp2pConfig()
  });
  console.log('IPFS node is ready');
  ipfs.on('error', error=>{
    o('log', 'IPFS on error:', error);
  });

  ipfs.on('init', error=>{
    o('log', 'IPFS on init:', error);
  });
  return ipfs;
}

exports.pubsubInit = (ipfs, roomNamePostfix, rpcEvent, broadcastEvent)=>{

  const townHall = Room(ipfs, "townHall" + roomNamePostfix);
  townHall.on('peer joined', townHallHandler.peerJoined);
  townHall.on('peer left', townHallHandler.peerLeft);
  townHall.on('subscribed', townHallHandler.subscribed);
  //townHall.on('rpcDirect', townHallHandler.rpcDirect);
  townHall.on('rpcDirect', rpcResponse(rpcDirectHandler));
  townHall.on('message', townHallHandler.messageHandler);
  townHall.on('error', (err)=>o('error', `*******   townHall has pubsubroom error,`, err));
  townHall.on('stopping', ()=>o('error', `*******   townHall is stopping`));
  townHall.on('stopped', ()=>o('error', `*******   townHall is stopped`));

  const taskRoom = Room(ipfs, 'taskRoom' + roomNamePostfix);
  taskRoom.on('subscribed', m=>o('log', 'subscribed', m));
  taskRoom.on('error', (err)=>o('error', `*******   TaskRoom has pubsubroom error,`, err));
  taskRoom.on('stopping', ()=>o('error', `*******   TaskRoom is stopping`));
  taskRoom.on('stopped', ()=>o('error', `*******   TaskRoom is stopped`));

  const blockRoom = Room(ipfs, 'blockRoom' + roomNamePostfix);
  blockRoom.on('subscribed', m=>o('log', 'subscribed', m));
  blockRoom.on('message', blockRoomHandler.messageHandler(ipfs))
  blockRoom.on('error', (err)=>o('error', `*******   blockRoom has pubsubroom error,`, err));
  blockRoom.on('stopping', ()=>o('error', `*******   blockRoom is stopping`));
  blockRoom.on('stopped', ()=>o('error', `*******   blockRoom is stopped`));

  rpcEvent.on("rpcRequest", townHallHandler.rpcRequest(townHall));
  rpcEvent.on("rpcResponseWithNewRequest", townHallHandler.rpcResponseWithNewRequest(townHall));
  rpcEvent.on("rpcResponse", townHallHandler.rpcResponse(townHall));
  if(broadcastEvent){
    broadcastEvent.on('taskRoom', (m)=>taskRoom.broadcast(m));
    broadcastEvent.on('blockRoom', (m)=>blockRoom.broadcast(m));  
  }

  return {townHall, taskRoom, blockRoom}
}
