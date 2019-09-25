import {describe, it, before} from 'mocha';

import { expect, should } from 'chai';

import _ from 'lodash';
import {crypto} from '../shared/utilities';

const C = {
  pubKey : crypto.getPublicKey(),
  priKey : crypto.getPrivateKey()
};

describe('shared/utility', ()=>{
  it('crypto', ()=>{
    const str = 'I am secret text';
    const r1 = crypto.encrypt(str, 'xyz');
    const r2 = crypto.decrypt(r1, 'xyz');
    expect(r2).to.eql(str);


    const r3 = crypto.publicEncrypt(str, C.pubKey);
    const r4 = crypto.privateDecrypt(r3, C.priKey);
    expect(r4).to.eql(str);

    const r5 = crypto.md5(str);
    expect(r5).to.eql('9b2d16c98b785a038a5087a05e0b6f1df8ffd47da2e9b8389fecaa09151c26a6');
  });

});

