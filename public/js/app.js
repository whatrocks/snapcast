// # App Setup

// ##### [Back to Table of Contents](./tableofcontents.html)

// Set up app properties.

var App = {};

App.init = function() {
  // Connect to sockets.io with unique ioRoom ID - either a new whiteboard or used and saved previously by [sockets.js](../docs/sockets.html)
  var ioRoom = window.location.href;
  App.socket = io(ioRoom);


  //** Video Chat Functionality ** 

  // Create a video chat Object.
  var webrtc = new SimpleWebRTC({
    // **localVideoEl**: the ID/element DOM element that will hold the current user's video
    localVideoEl: 'localVideo',
    // **remoteVideosEl**: the ID/element DOM element that will hold remote videos
    remoteVideosEl: '',
    
    // **autoRequestMedia**: immediately ask for camera access
    autoRequestMedia: true
  });

 
  // The room name is the same as our socket connection.
  webrtc.on('readyToCall', function() {
    webrtc.joinRoom(ioRoom);
  });

  // **Screenshare Functionality**

  var shareButton = document.getElementById('screenShareButton'),
    setButton = function (bool) {
      shareButton.innerText = bool ? 'share screen' : 'stop sharing';
    };

    // DOES THIS DO ANYTHING
  webrtc.on('localScreenRemoved', function() {
    console.log('local screen removed');
    setButton(true);
  });

  setButton(true);

  $('#screenShareButton').on('click', function () {
    if ( webrtc.getLocalScreen() ) {
      //stops the stream
      webrtc.stopScreenShare();
      //removes video element
      document.getElementById('shareContainer').removeChild(document.getElementById('background'));
      //clears the background
      changeBackground();
      setButton(true);
    } else {
      webrtc.shareScreen(function (err,data) {
        if (err) {
          setButton(true);
        } else {
          setButton(false);
        }
      });
    }
  });

  webrtc.on('localScreenAdded', function (video) {
    console.log("screen share was added ");
    video.onclick = function () {
      video.style.width = video.videoWidth + 'px';
      video.style.height = video.videoHeight + 'px';
    };
    //sets id to background for easy selection
    video.setAttribute('id', 'background');
    //add to invisible container div
    document.getElementById('shareContainer').appendChild(video);
    //change the canvas
    changeBackground(document.getElementById('background'));
  });

  // a peer video has been added - adds to remoteVideos div
  webrtc.on('videoAdded', function (video, peer) {
      //if someone is sharing their screen, change background to that video
      if (peer.type === 'screen') {
       changeBackground(video);
       // disable sharing button for others
       shareButton.disabled = 'disabled';
      } else {
        var remotes = document.getElementById('remoteVideos');
        if (remotes) {
            var container = document.createElement('div');
            container.className = 'videoContainer';
            container.id = 'container_' + webrtc.getDomId(peer);
            container.appendChild(video);

            // suppress context menu
            video.oncontextmenu = function () { return false; };

            remotes.appendChild(container);
        }
      }
  });

  // a peer video was removed - remove element from DOM
  webrtc.on('videoRemoved', function (video, peer) {
    //if a screenshare is being removed, change background to default
      if (peer.type === 'screen') {
       changeBackground();
       // re-enables share button now that sharing is done
       shareButton.disabled = 0;

      } else {
        var remotes = document.getElementById('remoteVideos');
        var el = document.getElementById(peer ? 'container_' + webrtc.getDomId(peer) : 'localScreenContainer');
        if (remotes && el) {
            remotes.removeChild(el);
        }
      }

  });
  
  // **Whiteboard**
  // Set properties of the whiteboard.
  App.canvas = $('#whiteboard');
  App.canvas[0].width = window.innerWidth;
  App.canvas[0].height = window.innerHeight - 130;
  App.context = App.canvas[0].getContext("2d");

  // Set properties of the background.
  App.bg = $('#bg');
  App.bg[0].width = window.innerWidth;
  App.bg[0].height = window.innerHeight - 130;
  App.bgcontext = App.bg[0].getContext("2d");

  // Set properties of the mouse click.
  App.mouse = {
    click: false,
    drag: false,
    x: 0,
    y: 0
  };

  // Initialize pen properties.
  // To add more new drawing features, i.e. different colours, thickness, add them to the ```App.pen``` object.
  App.pen = {
    fillStyle: 'solid',
    strokeStyle: "black",
    lineWidth: 5,
    lineCap: 'round'
  };

  // ```App.isAnotherUserActive``` is a Boolean that signals whether another user is currently drawing. The current implementation is such that only 1 user can draw at a time, i.e. simultaneous drawing is forbidden. To get rid of this functionality, remove  ```App.isAnotherUserActive``` and conditional loops that require it. 
  App.isAnotherUserActive = false;

  // ```App.stroke``` is an array of [x,y] coordinates for one drawing element. They are stored here, emitted ([in initialize.js](../docs/initialize.html)), and sent to [sockets.js](../docs/sockets.html). Once sent, ```App.stroke``` is emptied. 
  App.stroke = [];

  // ```App.prevPixel``` contains only 1 [x,y] coordinate pair - the coordinates of the previous pixel drawn. This is used in ```App.socket.on('drag'...``` for smooth rendering of drawn elements by other users. 
  App.prevPixel = [];


  // **Methods**

  // Draw according to coordinates.
  App.draw = function(x, y) {
    App.context.lineTo(x, y);
    App.context.stroke();
  };

  // Initialize before drawing: copy pen properties to ```App.context```, beginPath and set the starting coordinates to ```moveToX``` and ```moveToY```.
  App.initializeMouseDown = function(pen, moveToX, moveToY) {

    // Copy over current pen properties (e.g. fillStyle).
    for (var key in pen) {
      App.context[key] = pen[key];
    }

    // Begin draw.
    App.context.beginPath();
    App.context.moveTo(moveToX, moveToY);
  };



  // **Socket events**

  // Draw the board upon join.
  App.socket.on('join', function(board) {
    console.log("Joining the board.");

    // Check for null board data.
    if (board) {
      for (var i = 0; i < board.strokes.length; i++) {
        // Check for null stroke data.
        if (board.strokes[i]) {
          // Set pen and draw path.
          var strokesArray = board.strokes[i].path;
          var penProperties = board.strokes[i].pen;
          App.initializeMouseDown(penProperties, strokesArray[0][0], strokesArray[0][1]);

          // Draw the path according to the strokesArray (array of coordinate tuples).
          for (var j = 0; j < strokesArray.length; j++) {
            App.draw(strokesArray[j][0], strokesArray[j][1]);
          }
          App.context.closePath();
        }
      }
    }
  });


  // If another user is drawing, App.socket will receive a 'drag' event. App listens for the drag event and renders the drawing element created by the other user. 
  // Note that App prevents the current user from drawing while the other user is still drawing. 
  App.socket.on('drag', function(data) {
    App.isAnotherUserActive = true;
    console.log("Receiving data from another user:", data);

    // ```App.prevPixel``` is an array of the previous coordinates sent, so drawing is smoothly rendered across different browsers. 
    // If the ```App.prevPixel``` array is empty (i.e., this is the first pixel of the drawn element), then prevPixel is set as the coordinates of the current mouseclick. 
    if (App.prevPixel.length === 0) {
      App.prevPixel = data.coords;
    }

    // Initialize beginning coordinates and drawing.
    App.initializeMouseDown(data.pen, App.prevPixel[0], App.prevPixel[1]);
    App.draw(data.coords[0], data.coords[1]);

    // Set the current coordinates as App.prevPixel, so the next pixel rendered will be smoothly drawn from these coordinate points to the next ones. 
    App.prevPixel = data.coords;

  });

  // When the user has mouseup (and finished drawing) then ```App.prevPixel``` will be emptied.
  App.socket.on('end', function() {
    App.prevPixel = [];
    App.context.closePath();
    App.isAnotherUserActive = false;
  });

};
