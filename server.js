// # Main Server
// 
//warning!!! must change callbackURL when deploy!!!!! other wise twitter would not be able to send tokens back!!

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
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;

//use Twitter to make OAuth api calls. for more info: https://www.npmjs.com/package/twitter
var Twitter = require('twitter');

//------------passport authentication with twitter-------------//
//all of these just for using OAuth with passport:
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({ secret: 'what is going on' }));
app.use(passport.initialize());
app.use(passport.session());
var consumerKey = "mExebuSVx9OXrCHMWfGu8ZcqH";
var consumerSecret = "KgGnTXOHTCd9vDV4yV7pPsabqgGW92gt5lw7ZGWZvofVEjwKPQ";

//configuring the strategy:
passport.use(new TwitterStrategy({
    consumerKey: consumerKey,
    consumerSecret: consumerSecret,
    callbackURL: "http://icicle-kindling.herokuapp.com/twitter/callback"
  },

  function(token, tokenSecret, profile, done) {
    //pass these to serializeUser
    var userObj = {profile : profile, token : token, tokenSecret : tokenSecret};
    done(null, userObj);
  }
));

passport.serializeUser(function(user, done) {
  //user is from the strategy;
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.get('/twitterSignIn', passport.authenticate('twitter'));

//twitter will call this afterward to update the statue on the request
app.all("/twitter/callback", passport.authenticate('twitter', {
  successRedirect: '/new'
}));

app.get('/checkUserAuthSession', function (req, res, next) {
    //should return false for not having session on the server
    //or send the profile info back
    if (req.session.passport){
      res.status(200).send(req.session.passport);
    } else {
      res.status(400).send('false');
    }
});

app.use('/sendInvite', function(req, res, next){
  if (req.session.passport){
      //set all the keys for each user to make OAuth request.
      var client = new Twitter({
        consumer_key: consumerKey,
        consumer_secret: consumerSecret,
        access_token_key: req.session.passport.user.token,
        access_token_secret: req.session.passport.user.tokenSecret
      });

      var twitterMessage = 'check this out now!!!!! ';
      client.post('direct_messages/new', {screen_name : req.body.username, text : twitterMessage + req.body.link},  function(error, tweet, response){
        if(error){
          res.status(400).send(error);
        } else {
          res.status(200).send('you just made a request!');
        }
      });
  } else {
    res.status(400).send('you have no session set');
  }

});

var io;


// ## HTTPS Configuration for local testing
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
  console.log('inital getting at /');
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


//for some reason https doesn't work with ngrok, need to fix it later
// **Start the server.**
if ( !process.env.PORT ) {
  var httpsServer = https.createServer(credentials, app);
  httpsServer.listen(port, function() {
    console.log("listening at port: " + port);
  });
  //setting sockets
  io = require('socket.io')(httpsServer);
} else {

var httpServer = http.createServer(app);
  httpServer.listen(port, function() {
    console.log('server listening on', port, 'at', new Date());
  });
  
  io = require('socket.io')(httpServer);

}
