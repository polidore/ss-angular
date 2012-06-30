// My SocketStream app

var http = require('http')
  , ss = require('socketstream');

// Define a single-page client
ss.client.define('main', {
  view: 'app.html',
  css:  ['libs', 'app.styl'],
  code: ['libs', 'app'], //requires you to make a symlink from ../lib to libs
  tmpl: '*'
});

// Serve this client on the root URL
ss.http.route('/', function(req, res){
  res.serveClient('main');
})

// Code Formatters
ss.client.formatters.add(require('ss-stylus'));

// Minimize and pack assets if you type: SS_ENV=production node app.js
if (ss.env == 'production') ss.client.packAssets();

// Start web server
var server = http.Server(ss.http.middleware);
server.listen(3000);

// Start SocketStream
ss.start(server);
