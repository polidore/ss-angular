// My SocketStream app

var http = require('http'),
    ss = require('socketstream');

// Define a single-page client
ss.client.define('main', {
  view: 'index.html',
  css:  ['libs', 'app.less'],
  code: ['libs', 'app'], //requires you to make a symlink from ../lib to libs
  tmpl: '*'
});

ss.session.options.maxAge = 2.6*Math.pow(10,9);

// Serve this client on the root URL
ss.http.route('/', function(req, res){
  res.serveClient('main');
});

// Code Formatters
ss.client.formatters.add(require('ss-less'));
ss.client.templateEngine.use('angular');

//responders
ss.responders.add(require('ss-angular'),{pollFreq: 1000});

// Minimize and pack assets if you type: SS_ENV=production node app.js
if (ss.env == 'production') ss.client.packAssets();

// Start web server
var server = http.Server(ss.http.middleware);
server.listen(4000);

// Start SocketStream
ss.start(server);
