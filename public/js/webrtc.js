angular.module('snapcast.webrtc', [])
.directive('kiWebrtc', function(socket) {
   return {
      restrict: 'AE',
      link: function (scope) {

        // Initialize webrtc
        var webrtc = new SimpleWebRTC({
          // LocalVideoElement id
          localVideoEl: 'localVideo',
          remoteVideosEl: '',
          //immediately asks for camera access
          autoRequestMedia: true
        });

        // The room name is the same as our socket connection.
        webrtc.on('readyToCall', function() {
          webrtc.joinRoom(socket.ioRoom);
        });

        var shareButton = angular.element($('#screenShareButton')),
        faceShareButton = angular.element($('#faceShareButton')),

        setButton = function (bool) {
          shareButton.text((function() {return bool ? 'share screen' : 'stop sharing';})());
        },
        setFaceShareButton = function (bool) {
          faceShareButton.text((function() {return bool ? 'share face' : 'stop sharing';})());
        },
        faceSharing = false;

        webrtc.on('localScreenRemoved', function() {
          scope.$broadcast('screenshare:removed');
          setButton(true);
        });

        setButton(true);
        setFaceShareButton(true);

       // SCREEN SHARE FUNCTIONALITY 
       shareButton.on('click', function () {
           if ( webrtc.getLocalScreen() ) {
             //stops the stream
             webrtc.stopScreenShare();
             //removes video element
             document.getElementById('shareContainer').removeChild(document.getElementById('background'));
             //clears the background
             scope.$broadcast('screenshare:removed');
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

       // FACE SHARE FUNCTIONALITY 
       faceShareButton.on('click', function() {
         if (!faceSharing) {
          // gets the local video for local bg swap
            var video = document.getElementById('localVideo');
          // exports the connection id for remote sharing
            var id = webrtc.connection.connection.id;
          // sends id to server
            socket.emit('faceshare', id);
            scope.$broadcast('screenshare', video);
         } else {
            socket.emit('faceshare');
            scope.$broadcast('screenshare:removed');
         }
         setFaceShareButton(faceSharing);
         faceSharing = !faceSharing;

       });

       socket.on('faceshare', function(peer) {
        // select the peer according to id
        // console.log('faceSharing:', faceSharing);
        if (faceSharing && !peer) {
          
          scope.$apply(function() {
             scope.shareDisabled = false;
          });

          // console.log('disabling');
          scope.$broadcast('remoteshare:removed');
        } else {
          var video = document.getElementById(peer + '_video_incoming');
           
          // console.log('enabling');
           scope.$apply(function() {
             scope.shareDisabled = true;
          });
          scope.$broadcast('remoteshare', video);
        }
         faceSharing = !faceSharing;
         // console.log('changing to', faceSharing);
       });
       
      // Handles local video streaming
        webrtc.on('localScreenAdded', function (video) {
          video.onclick = function () {
            video.style.width = video.videoWidth + 'px';
            video.style.height = video.videoHeight + 'px';
          };
          //sets id to background for easy selection
          video.setAttribute('id', 'background');
          //add to invisible container div
          angular.element($('#shareContainer')).append(video);
          //change the canvas
          scope.$broadcast('screenshare', video);
        });

        // Handles addition of peer/remote videos
        webrtc.on('videoAdded', function (video, peer) {
            //if someone is sharing their screen, change background to that video
            if (peer.type === 'screen') {
             scope.$broadcast('remoteshare', video);
             // disable sharing button for others
             scope.$apply(function() {
              scope.shareDisabled = true;
            });


            } else {
              var remotes = angular.element($('#remoteVideos'));
              if (remotes) {
                  var container = document.createElement('div');
                  container.className = 'videoContainer';
                  container.id = 'container_' + webrtc.getDomId(peer);
                  container.appendChild(video);

                  // suppress context menu
                  video.oncontextmenu = function () { return false; };
                  remotes.append(container);
              }
            }
        });

        // Handles removal of peer video
        webrtc.on('videoRemoved', function (video, peer) {
          //if a screenshare is being removed, change background to default
            if (peer.type === 'screen') {
             // changeBackground();
             scope.$broadcast('remoteshare:removed', video);
             // re-enables share button now that sharing is done
              scope.$apply(function() {
                scope.shareDisabled = false;
             });
              
            } else {
              var remotes = document.getElementById('remoteVideos');
              var options = (function(){return peer ? 'container_' + webrtc.getDomId(peer) : 'localScreenContainer';})();
              var el = document.getElementById(options);            
              if (remotes && el) {
                  remotes.removeChild(el);
              }
            }
        });
        

      }
    };
});