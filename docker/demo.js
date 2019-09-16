const Docker = require('./index');
const fs = require('fs');

const arg = process.argv[2];

const code = fs.readFileSync(process.cwd()+'/'+arg+'.jpg');
const str = Buffer.from(code).toString('base64').replace('data:image/jpeg;base64,', '');

const d = new Docker();
d.run({
  type : 'image',
  code : str
});


