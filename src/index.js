require("@babel/register");
require("@babel/polyfill");
var {getOptions, startApp} = require('./app.js');
startApp(getOptions());