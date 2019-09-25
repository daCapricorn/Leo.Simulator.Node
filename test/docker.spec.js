import {describe, it, before} from 'mocha';
import { expect, should } from 'chai';

import {fake_img} from './fake';
import _ from 'lodash';
import fs from 'fs';

import Docker from '../docker';
describe('docker folder', ()=>{

  const getPath = ()=>{
    return __dirname+'/../demo-data';
  }

  it('run', ()=>{
    const pyCode = fs.readFileSync(getPath()+'/run.py', 'utf8');
    const rs = Docker.run({
      type : 'image',
      imageBase64 : fake_img,
      pyCode,
      docker_yaml : `
      version: '3'
      services:
        computer-leo:
          container_name: leo
          image: kevingzhang/leo_python:demo201909
          volumes:
            - ./run.py:/LEO/run.py
            - ./test.jpg:/LEO/test.jpg
          command: python run.py
      `
    });

    expect(rs).not.to.eql(true);
  });
});

