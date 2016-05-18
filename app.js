var express = require('express');
var config = require('./config/config');
var static = require('serve-static')
var join = require('path').join

var app = express();
app.use(static(join(__dirname,'public/js')));
app.use(static(join(__dirname,'public/css')));
app.use(static(join(__dirname,'app/views')));
app.use(static(join(__dirname,'config')));
app.listen(config.port, function () {
  console.log('Express server listening on port ' + config.port);
});

/*
var express = require('express'),
  config = require('./config/config');

var app = express();

require('./config/express')(app, config);

app.listen(config.port, function () {
  console.log('Express server listening on port ' + config.port);
});
*/
