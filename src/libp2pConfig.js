
//const WebRTCStar = require('libp2p-webrtc-star')
const WebSockets = require('libp2p-websockets')
const WebSocketStar = require('libp2p-websocket-star')
// const Mplex = require('libp2p-mplex')
// const SPDY = require('libp2p-spdy')
const SECIO = require('libp2p-secio')
// const Bootstrap = require('libp2p-bootstrap')
const DHT = require('libp2p-kad-dht')
const Gossipsub = require('libp2p-gossipsub')
// const Info = require("peer-info")
const createP2POptions = ()=>{
  return {
    modules: {
      // transport: [
      //   WebSockets,
      //   WebSocketStar
      // ],
      connEncryption: [
        SECIO
      ],
      dht: DHT,
      //pubsub: Gossipsub
    },
    // config: {
    //   peerDiscovery: {
    //     autoDial: true,
    //     webRTCStar: {
    //       enabled: true
    //     },
    //     websocketStar: {
    //       enabled: true
    //     },
    //     // bootstrap: {
    //     //   interval: 20e3,
    //     //   enabled: true,
    //     //   list: bootstrapList
    //     // }
    //   },
    //   relay: {
    //     enabled: true,
    //     hop: {
    //       enabled: false,
    //       active: false
    //     }
    //   },
    //   dht: {
    //     enabled: false
    //   },
    // },
  }
}
module.exports = createP2POptions;
