//import colors from 'colors';
const CryptoJS = require("crypto-js");
const tripledes = require("crypto-js/tripledes");
const node_crypto = require('crypto');


module.exports.exitGraceful = (exitCode = 0) => {

  process.exitCode = exitCode;

};

module.exports.tryParseJson = (s)=>{
  try{
    return JSON.parse(s);
  }
  catch(e){
    return undefined;
  }
};

// des encrypt and decrpty
exports.crypto = {
  md5(message){
    return CryptoJS.HmacSHA256(message, 'leo').toString();
  },
  getPublicKey(){
    //TODO get from internal cpu
    return  `-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDYJZoSy9/P+dQwWsxMaeQj9Nkb\nS9UuGlrFB5AaE+bjlCeMhmMM+mbQPxFfsb5Fhfftq+rgW7LiuKIxbD2DeG8Fn3r3\n71oQtJK5KGLRLV17ZWEL159G5ChFL1+q62t5IgpYFi4g2i1e+51t3ZfRXt5BwzOg\ntNMSZtENYIGE9aCeTwIDAQAB\n-----END PUBLIC KEY-----\n`;
  },
  getPrivateKey(){
    //TODO get from internal cpu
    return `-----BEGIN RSA PRIVATE KEY-----\nMIICXAIBAAKBgQDYJZoSy9/P+dQwWsxMaeQj9NkbS9UuGlrFB5AaE+bjlCeMhmMM\n+mbQPxFfsb5Fhfftq+rgW7LiuKIxbD2DeG8Fn3r371oQtJK5KGLRLV17ZWEL159G\n5ChFL1+q62t5IgpYFi4g2i1e+51t3ZfRXt5BwzOgtNMSZtENYIGE9aCeTwIDAQAB\nAoGBAIUFly3MNMCdAx6DMsowPQx36olnARqvc39gqSmzZ9xVWIWeSyU4kb/FoJ6h\nF/VXfn7R1+od5RitAnyiHbVkkAXnVx40V9dQOS3aYRVA4f303t9prj0cO5BB1DAk\npMehFI/APbEz18K31M6D5jqu/mvn3iPhfNmVp5NA45XH4f1JAkEA7Cvoewm20GTU\nK8weyLXuhdi4ktwHAIexIap0mdbGRwdgQFm+wo6MHUf/R7Y95dIstjrYHgFD6f2V\ndGAOshg10wJBAOpLTKT27Z1eAwY0e7TOC/0WAti5Oo330sLQnPDMwuoq2s+bSaO9\nlBdg7+rFCrjMIp5668R4VIlSlWbpRCzmfBUCQGmw6LSPT1oJlY4YJjqqeJk7uLY4\nc4XAM/wd/VqPbGKDIYcK4rzM8FV2T/82xpKgMVRIF0muRUdlLcpL5qe6//MCQD1Q\njXNSh+a6FrKGA6XSkoKeQwpylydWJtsC+z9tZskfg/n22rO2Rk5D+SWIgYDRM3Ik\nGxVkpEL30M+I1mWlv+0CQDhQWBCA+IexvM/+4o9e5AdEmO5QqTZ7JyMsuSojWdMT\ngHVRkvXwNSGQ0NazQPuJWh/nlq5lFR2JJFtSU3A2AWI=\n-----END RSA PRIVATE KEY-----\n`;
  },

  encrypt(message, key){
    return tripledes.encrypt(message, key).toString();
  },
  decrypt(data, key){
    return tripledes.decrypt(data, key).toString(CryptoJS.enc.Utf8)
  },

  publicEncrypt(message, pubKey){
    const encryptText = node_crypto.publicEncrypt({
      key: pubKey
    }, Buffer.from(message, 'utf8'));

    return encryptText.toString('base64');
  },
  privateDecrypt(data, priKey){
    const decryptText = node_crypto.privateDecrypt({
      key: priKey
    }, Buffer.from(data, 'base64'));
    return decryptText.toString('utf8');
  }
};

const _cache = {};
exports.cache = {
  set(k, v){
    _cache[k] = v;
  },
  get(k){
    return _cache[k];
  }
};

