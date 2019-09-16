//import colors from 'colors';

module.exports.exitGraceful = (exitCode = 0) => {

  process.exitCode = exitCode;

};


module.exports.o = (type, ... messages) =>{
  try{
    console[type].apply(this, messages);
  }
  catch(e){
    console.error('Utilities.o has exception,', e);
  }
  

};



module.exports.tryParseJson = (s)=>{
  try{
    return JSON.parse(s);
  }
  catch(e){
    return undefined;
  }
};

