const fs = require('fs');
const _executeFunc = ()=>{
  const spawn = require('child_process').spawnSync;
  console.log("before cmd. local folder", __dirname);
  const cmd = spawn('docker-compose', ['-f', __dirname +'/docker-compose.yml', 'up']);
  
  //console.log(`stdout: ${cmd.stdout.toString()}`);

  const rs = cmd.stdout.toString().split('\n');
  const rs_str = rs[1].split('|')[1].replace(/ /, '').replace('\u001b[0m', '').toString();
  //this.saveToImageFromBase64('result.jpg', rs_str);
  const demo_data_folder = require('path').resolve(__dirname, '..') + '/demo-data';
  fs.writeFileSync(demo_data_folder + '/result.jpg', Buffer.from(rs_str, 'base64'));
  return rs_str;
}

exports.run = ({imageBase64, pyCode, docker_yaml})=>{
  const buf = Buffer.from(imageBase64, 'base64');
  fs.writeFileSync(__dirname+ '/test.jpg', buf);
  fs.writeFileSync(__dirname +'/run.py', Buffer.from(pyCode, 'utf8'));
  fs.writeFileSync(__dirname + '/docker-compose.yml', Buffer.from(docker_yaml, 'utf8'));
  console.log('Please check the folder to make sure temp files exists', __dirname);
  try{
    const res =  _executeFunc();
    return res;
  }
  catch(e){
    console.log('exec docker has exception,', e);
  }
  
}
