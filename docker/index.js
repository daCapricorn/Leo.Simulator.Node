const fs = require('fs');

module.exports = class {
  constructor(){

  }

  buildFuncString({code, type}){
    if(type === 'test') return code;
    if(type === 'image') return code;


    return '';
  }

  getPath(){
    // return process.cwd()+'/docker';
    return __dirname;
  }

  writeToFile(str){
    // fs.writeFileSync(this.getPath()+'/test.js', str, {
    //   encoding: 'utf8'
    // });

    this.saveToImageFromBase64('test.jpg', str);

    return true;
  }

  executeFunc(){
    const spawn = require('child_process').spawnSync;
    const cmd = spawn('docker-compose', ['-f', this.getPath()+'/docker-compose.yml', 'up']);
    
    console.log(`stdout: ${cmd.stdout.toString()}`);

    const rs = cmd.stdout.toString().split('\n');
    const rs_str = rs[1].split('|')[1].replace(/ /, '').replace('\u001b[0m', '').toString();
    this.saveToImageFromBase64('result.jpg', rs_str);

    return rs_str;
  }

  saveToImageFromBase64(name, base64){
    const buf = Buffer.from(base64, 'base64');
    fs.writeFileSync(this.getPath()+'/'+name, buf);
    return true;
  }

  run(code){
    const img = this.buildFuncString(code);
    this.writeToFile(img);
    return this.executeFunc();
  }
};