
import chai, { expect, should } from 'chai';
import {describe, it, before} from 'mocha';

import chaiAsPromised from "chai-as-promised";
import 'babel-polyfill';
chai.use(chaiAsPromised);

// import {ipfsInit} from '../src/ipfsInit';

import IPFS  from 'ipfs';

// describe('IPFS', ()=>{
//   describe('ipfs init', ()=>{
//     it('ipfs init with option default to local. This test intend to end with pending.',async ()=>{
//       const ipfs = await ipfsInit('/ip4/127.0.0.1/tcp/9090/ws/p2p-websocket-star');
//       console.log("peerId is", ipfs._peerInfo.id.toB58String());
//       expect(ipfs).to.exist;
//     });
//   });
// });



const ipfsInit = async (swarmUrlOption)=>{
  console.log('swarmUrlOption:|', swarmUrlOption, '|');
  //const swarmUrl = swarmUrlOption == 'local'? '/ip4/127.0.0.1/tcp/9090/ws/p2p-websocket-star': swarmUrlOption;
  const swarmUrl = swarmUrlOption == 'public'? '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star': swarmUrlOption;
  
  console.log('swarmUrl:|', swarmUrl, '|');
  const ipfs = await IPFS.create({
    repo: 'ipfs-storate-no-git/' + Math.random(),
    EXPERIMENTAL: {
      pubsub: true
    },
    config: {
      Addresses: {
        Swarm: [
          swarmUrl
        ]
      }
    }
  });
  console.log('IPFS node is ready');
  // ipfs.on('error', error=>{
  //   o('log', 'IPFS on error:', error);
  // });

  // ipfs.on('init', error=>{
  //   o('log', 'IPFS on init:', error);
  // });
  return ipfs;
}

