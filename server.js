// # Main Server

// ##### [Back to Table of Contents](./tableofcontents.html)

// ## Dependencies
var express = require('express');
var request = require('request');
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

app.use(bodyParser.json());


//------------passport authentication with twitter-------------//
//
//all of these just for using OAuth with passport:
app.use(cookieParser());
app.use(session({ secret: 'what is going on' }));
app.use(passport.initialize());
app.use(passport.session());

var consumerKey = "mExebuSVx9OXrCHMWfGu8ZcqH";
var consumerSecret = "KgGnTXOHTCd9vDV4yV7pPsabqgGW92gt5lw7ZGWZvofVEjwKPQ";

//test session:
app.use('/session', function(req, res, next){

  //req.session.passport.user.token or req.session.passport.tokenSecret
  //make sure to check and see if req.session.passport even exist
  //if not then no authenticate session is set
  if (req.session.passport){
    res.status(200).send('found you!');
    //the session obj format: req.session.passport, then there are: profile and user.
    console.log('the session object Contents', req.session.passport.user.token);
  } else {
    res.status(400).send('no session found');
  }
});


//concept proving:
app.use('/update', function(req, res, next){
  if (req.session.passport){
      //set all the keys for each user to make OAuth request.
      console.log('trying to update: with these numbers:', req.session.passport.token, req.session.passport.tokenSecret);
      var client = new Twitter({
        consumer_key: consumerKey,
        consumer_secret: consumerSecret,
        access_token_key: req.session.passport.user.token,
        access_token_secret: req.session.passport.user.tokenSecret
      });

      client.post('direct_messages/new', {screen_name : 'whatrocks', text : 'can you see this: https://icicle-kindling.herokuapp.com/5650c93673a5fa0300f29e75'},  function(error, tweet, response){
        if(error) console.log(error);
        console.log(tweet);  // Tweet body. 
        console.log(response);  // Raw response object. 
      });
      res.status(200).send('you just sent it!');
  } else {
    res.status(400).send('you have no session set');
  }

});


//configuring the strategy:
passport.use(new TwitterStrategy({
    consumerKey: consumerKey,
    consumerSecret: consumerSecret,
    callbackURL: "http://c70d3a67.ngrok.io/auth/twitter/callback"
  },

  function(token, tokenSecret, profile, done) {
    //pass these to serializeUser
    console.log('this is the function inside of the new strategy',token, tokenSecret, profile, done);
    var userObj = {profile : profile, token : token, tokenSecret : tokenSecret};
    done(null, userObj);
  }
));

app.use('/suc', function (req, res, next) {
  var profileObj = {
    legalName : req.session.passport.user.profile.displayName,
    screenName : req.session.passport.user.profile.username,
    profilePic : req.session.passport.user.profile.photos[0].value,
    therest : req.session.passport
  };
  res.send(200, profileObj);
});

app.get('/waytest', passport.authenticate('twitter'));

//testing twitter's callback:
app.all("/auth/twitter/callback", passport.authenticate('twitter', {
  successRedirect: '/suc'
}));

passport.serializeUser(function(user, done) {
  //user is from the strategy;
  console.log('--------------------------------------------------------the user is:', user);
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});



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


