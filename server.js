// # Main Server

// ##### [Back to Table of Contents](./tableofcontents.html)

// ## Dependencies
var express = require('express');
var app = express();
var http = require('http');
var https = require('https');
var fs = require('fs');
var Board = require('./db/board');
var port = process.env.PORT || 8080;
var handleSocket = require('./server/sockets');

// ## Toggle HTTP / HTTPS for local testing
// ** Set 'localMode' to true if you want to use HTTPS mode locally (required for locally testing screen sharing)
// ** Set 'localMode' to false when deploying to Heroku
var localMode = false;

var io;

if ( localMode ) {
  io = require('socket.io')(https);  
} else {
  io = require('socket.io')(http);
}

// ## HTTPS Configuration for localhost
var privateKey = fs.readFileSync('./server/ssl/server.key', 'utf8');
var certificate = fs.readFileSync('./server/ssl/server.crt', 'utf8');
var credentials = { key: privateKey, cert: certificate };

// ## Routes

// **Static folder for serving application assets**
app.use('/', express.static(__dirname + '/public'));

// **Static folder for serving documentation**
app.use('/documentation', express.static(__dirname + '/docs'));

// **Home Page**
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

// **Documentation Page**
app.get('/documentation', function(req, res) {
  res.sendFile(__dirname + '/docs/tableofcontents.html');
});


// **Get a new whiteboard**
app.get('/new', function(req, res) {
  // Create a new mongoose board model.
  var board = new Board.boardModel({strokes: []});
  var id = board._id.toString();
  board.save(function(err, board) {
    if (err) { console.error(err); }
    else {
      console.log('board saved!');
    }
  });
  // Redirect to the new board.
  res.redirect('/' + id);
});


// **Wildcard route & board id handler.**
app.get('/*', function(req, res) {
  var id = req.url.slice(1);
  Board.boardModel.findOne({id: id}, function(err, board) {
    // If the board doesn't exist, or the route is invalid,
    // then redirect to the home page.
    if (err) {
      res.redirect('/');
    } else {
      // Invoke [request handler](../documentation/sockets.html) for a new socket connection
      // with board id as the Socket.io namespace.
      handleSocket(req.url, board, io);
      // Send back whiteboard html template.
      res.sendFile(__dirname + '/public/board.html');
    }
  });
});

// **Start the server.**
if ( localMode ) {
  var httpsServer = https.createServer(credentials, app);
  httpsServer.listen(port, function() {
    console.log("listening at port: " + port);
  });
} else {
  var httpServer = http.createServer(app);
  httpServer.listen(port, function() {
    console.log('server listening on', port, 'at', new Date());
  });
}


