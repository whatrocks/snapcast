/* You'll need to have mongo running on the right url and your Node server running
 * for these tests to pass. */

var mongoose = require('mongoose');
var request = require("request"); // You might need to npm install the request module!
var expect = require('chai').expect;
var Board = require('../db/board').boardModel;

var newBoard, boardID;
var db = mongoose.connection;
var board = db.model('board');

describe("Persistent Boards Server", function() {

  beforeEach(function(done) {
    newBoard = board({strokes: []});
    boardID = newBoard._id;

    newBoard.save(function() {
      done();
    });
  });

  afterEach(function(done) {
    Board.find({_id: boardID}).remove(function() {
      done();
    });
  });

  it("Should create a board with a unique id", function(done) {
    Board.find({_id: boardID}, function(err, docs) {
      expect(docs.length).to.equal(1);
      done();
    });
  });

  it("Should save strokes", function(done) {
    var stroke = [[1,1],[2,2],[3,3]];

    Board.update({_id: boardID},{$push: {strokes: stroke} },{upsert:true}, function() {
      Board.findOne({_id: boardID}, function(err, doc) {
        expect(doc.strokes.length).to.be.equal(1);
        done();
      });
    });
  });

  it("Should save strokes to the right board", function(done) {
    var otherBoard = board({strokes: [[[4,1],[5,2],[6,3]]]});
    var stroke1 = [[1,1],[2,2],[3,3]];

    Board.update({_id: boardID},{$push: {strokes: stroke1} },{upsert:true}, function() {
      Board.findOne({_id: boardID}, function(err, doc) {
        expect(otherBoard.strokes).to.not.deep.equal(doc.strokes);

        // Remove otherboard
        Board.find({_id: otherBoard._id}).remove(function() {
          done();
        });
      });
    });
  });

  it("Should retrieve boards with all of its strokes", function(done) {
    var stroke1 = [[1,1],[2,2],[3,3]];
    var stroke2 = [[4,4],[5,5],[6,6]];

    expect(newBoard.strokes.length).to.equal(0);

    Board.update({_id: boardID},{$push: {strokes: stroke1} },{upsert:true}, function() {
      Board.update({_id: boardID},{$push: {strokes: stroke2} },{upsert:true}, function() {
      });
    });

    setTimeout(function() {
      Board.findOne({_id: boardID}, function(err, doc) {
        expect(doc.strokes.length).to.equal(2);
        done();
      });
    }, 500); // If this test fails, you might have to increase this time.
  });
});
