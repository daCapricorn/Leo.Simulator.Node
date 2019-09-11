import IPFS  from 'ipfs';
import Room from 'ipfs-pubsub-room';
import {utilities} from 'leo.simulator.shared';
const {o} = utilities;
import townHallHandler from './townHallHandler';
import blockRoomHandler from './blockRoomHandler';

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
          swarmUrl.trim()
        ]
      }
    }
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
  const testRoom = Room(ipfs, 'testRoom');
  testRoom.on('peer joined', (m)=>console.log('testRoom peer joined received,', m));
  testRoom.on('subscribed', m=>o('log', 'testRoom subscribed', m));
  const townHall = Room(ipfs, "townHall" + roomNamePostfix);
  townHall.on('peer joined', (m)=>console.log('peer joined received,', m));
  //townHall.on('peer joined', townHallHandler.peerJoined);
  townHall.on('peer left', townHallHandler.peerLeft);
  townHall.on('subscribed', townHallHandler.subscribed);
  townHall.on('rpcDirect', townHallHandler.rpcDirect);
  townHall.on('message', townHallHandler.messageHandler);

  const taskRoom = Room(ipfs, 'taskRoom' + roomNamePostfix);
  taskRoom.on('subscribed', m=>o('log', 'subscribed', m));
  
  const blockRoom = Room(ipfs, 'blockRoom' + roomNamePostfix);
  blockRoom.on('subscribed', m=>o('log', 'subscribed', m));
  blockRoom.on('message', blockRoomHandler.messageHandler(ipfs))

  rpcEvent.on("rpcRequest", townHallHandler.rpcRequest(townHall));
  rpcEvent.on("rpcResponseWithNewRequest", townHallHandler.rpcResponseWithNewRequest(townHall));
  rpcEvent.on("rpcResponse", townHallHandler.rpcResponse(townHall));
  if(broadcastEvent){
    broadcastEvent.on('taskRoom', (m)=>taskRoom.broadcast(m));
    broadcastEvent.on('blockRoom', (m)=>blockRoom.broadcast(m));  
  }
  return {townHall, taskRoom, blockRoom}
}