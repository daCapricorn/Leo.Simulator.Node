
export default (type, ... messages) =>{
  switch(type){
    case 'err':
    case 'error':
      console.error(...messages);
      if(global.log)  global.log('error', messages[0])
      break;
    case 'info':
      console.log(...messages);
      if(global.log)  global.log('info', messages[0])
      break;
    case 'log':
    case 'debug':
      console.log(...messages);
      
      break;
    case 'warning':
      console.log(...messages);
      if(global.log)  global.log('warning', messages[0])
      break;
    case 'status':
      console.log(...messages);
      if(global.log)  global.log('status', messages[0]);
      break;
    case 'data':
      if(global.log)  global.log('data', messages[0]);
      break;
    default:
      console.log(...messages);
  }
}