
import {utilities} from '../shared';
const {tryParseJson} = utilities;
import o from './logWebUi'

exports.messageHandler = (ipfs)=>async (message)=>{
  const blockObj = tryParseJson(message.data);
  if(typeof blockObj == 'undefined'){
    
    return o('error', 'In block room got an non-parsable message from ' + message.from + ': ' + message.data.toString());
  }
  const {txType, cid, height} = blockObj;
  if(txType != 'newBlock'){
    return o('error', 'In block room got an unhandled message from ' + message.from + ': ' + message.data.toString());
  }
  if(! global.userInfo){
    o('log', "Still waiting to get my userInfo from layerone. I cannot process new block at this moment");
    return;
  }
  global.blockMgr.pushNewBlock(height, cid);
}
