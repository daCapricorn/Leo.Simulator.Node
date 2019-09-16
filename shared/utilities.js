//import colors from 'colors';

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

