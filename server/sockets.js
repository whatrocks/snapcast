// # Socket Connection Handler

// ##### [Back to Table of Contents](./tableofcontents.html)

// Import board model from [board.js](../documentation/board.html)
var Board = require('../db/board');

// **boardUrl:** *String* <br>
// **board:** *Mongoose board model* <br>
// **io:** *Export of our Socket.io connection from [server.js](../documentation/server.html)*
var connect = function(boardUrl, board, io) {
  // Set the Socket.io namespace to the boardUrl.
  var whiteboard = io.of(boardUrl);

  whiteboard.on('connection', function(socket) {
    // Send the current state of the board to the client immediately on joining.
    // socket.emit('join', board);

    socket.on('draw', function(canvas) {
       socket.broadcast.emit('draw', canvas);
    });

    socket.on('clear', function(data) {
       socket.broadcast.emit('clear', data);
    });
  
    socket.on('faceshare', function(peer) {
       socket.broadcast.emit('faceshare', peer);
    });

  });

  // NOTE: Instead of storing coordinates in Mongo, we can now store the most recent canvas
  // In order to do so we will need to change the schema to something like the following:
  // image: { data: Buffer, contentType: String}
  // for more info see this gist: https://gist.github.com/aheckmann/2408370
};

// Required by [server.js](../documentation/server.html)
module.exports = connect;
