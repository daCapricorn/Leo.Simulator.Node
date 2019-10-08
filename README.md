# How to run the demo
Go to https://github.com/elastos/Leo.Simulator.Docs
Follow the instruction and run the demo

# Major Task List Oct 2019 - Dec 2019
## Replace js-ipfs instances in each node with standalone IPFS daemon

In this demo stage I design each node runs a separate js-ipfs instance because I want them to be running side by side in one computer without any conflict in between. that is one of the purpose of the demo : Each node is technically individual without anything centlized.

Once the demo stage is over. we are moving to the next stage: run the whole things in Raspberry Pi (or Pi simulators) with docker support. This is one step closer to our real product. 

In order to get to this stage. The first step is to rewrite the ipfs parts, so that we can move the ipfs instance out of node. 

In the real product case,  there will be a standalone IPFS docker container running docker daemon as a public server provide ipfs service to all other docker containers.

After this update. The node itserlf won't have js-ipfs instances. All ipfs access will throught a http call to the standalone ipfs server.

In the long future, we will update all the communication to gRPC over HTTP/2. but for now, I am ok to use old standard http call/rest call

## Run node in docker side by side with IPFS docker
Once the first step (above) done, build the node into a docker images (as ARMv7-32bit). Setup docker swarm that the node container in the same network as an existing ipfs docker contianer. 

Run the node and make sure the node can connect to IFPS and other nodes via the ipfs docker container.

## Rewrite all layer-one related API to Web3.js

In our demo sep2019, we did not use any blockchain. We just use a faked layer-one node.js server to server as a blockchain. In our Dec 2019 demo, we aim to use the ELA sidechain ETH smart contract as the layer one blockchain.

ETH support web3.js, so we will need to send all layer one request using web3.js.

In our product, we should not trust any ETH light nodes. So we will run a ETH node (do not mine ETH, just join the ETH p2p network to get update blocks). This ETH node will be runniing inside a docker container. 

It is not a mining node. It just join the ETH p2p network to
- create tx from other sibling docker container's web3.js request
- listen to new conirmed ETH block. Get the new state of our LEO smart contract and broadcast to all other sibling docker containers (if they subscribed the new block broadcasting).

I will put this ETH micro service into a new separate task

## Listening to ELA sidechain new block 
As describe above. A micro service to be a replay between other sibling containers and ELA/ETH network.

