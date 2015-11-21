/*
To make these tests pass, you have to change 'root/server/sockets.js':15
##  whiteboard.once('connection', function(socket) { ##
to
##  whiteboard.on('connection', function(socket) { ##

Also, don't forget to change it back when you're done testing, else the app will
be buggy.
 */

var expect = require('chai').expect;
var handler = require('../server/sockets');
var socket = require('socket.io-client');
var io = require('socket.io')(9000);

describe("Server side socket handler", function() {
  //****************************************************************************
  //
  //              "global" test functionality
  //
  //****************************************************************************

  // Initialize server socket handler which registers event listeners
  var testBoard = {
    _id: "test",
    strokes: [
      [[1,1],[2,2],[3,3]],
      [[4,4],[5,5],[6,6]],
      [[7,7],[8,8],[9,9],[7,10],[8,10],[9,10]]
    ]
  };

  handler('/test', testBoard, io);

  var client1, client2, numReady;
  var options = { multiplex: false };

  // Custom function for detecting when both boards have joined
  function ready(done, callback) {
    numReady++;
    if(numReady === 2) {
      if ( callback ) {
        callback();
      }

      done();
    }
  }

  //****************************************************************************
  //
  //              Before and After each hooks
  //
  //****************************************************************************
  beforeEach(function(done) {
    numReady = 0;
    client1 = socket('http://localhost:9000/test', options);
    client2 = socket('http://localhost:9000/test', options);

    done();
  });

  afterEach(function(done) {
    client1.disconnect();
    client2.disconnect();

    done();
  });

  //****************************************************************************
  //
  //              Tests start here
  //
  //****************************************************************************
  it('Should send back the requested board history on connection', function(done) {
    client2.on('join', function(board) {
      expect(board).to.have.property('_id');
      expect(board).to.have.property('strokes');

      ready(done);
    });

    client1.on('join', function(board) {
      expect(board).to.have.property('_id');
      expect(board).to.have.property('strokes');

      ready(done);
    });
  });

  it('Should emit and respond to "drag" events', function(done) {
    client2.on('join', function() {
      var pen = {
        fillStyle: 'solid',
        strokeStyle: "black",
        lineWidth: 5,
        lineCap: 'round'
      };

      client2.emit('start', pen);
      client2.emit('drag', [10, 29]);
    });
    client1.on('drag', function(data) {
      expect(data).to.be.instanceof(Object);
      expect(data).to.have.property('pen');
      expect(data).to.have.property('coords');
      done();
    });
  });

  it('Should respond to "end" events', function(done) {
    client2.on('join', function() {
      client2.emit('end');
    });
    client1.on('end', function() {
      done();
    });
  });
});
