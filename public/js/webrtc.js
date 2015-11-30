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
        setButton = function (bool) {
          shareButton.text((function() {return bool ? 'share screen' : 'stop sharing';})());
        };

        webrtc.on('localScreenRemoved', function() {
          console.log('local screen removed');
          setButton(true);
        });

        setButton(true);

       // SCREEN SHARE FUNCTIONALITY 
          scope.$on('screenshare', function (e) {
            console.log('webrtc heard it')
              if ( webrtc.getLocalScreen() ) {
                //stops the stream
                webrtc.stopScreenShare();
                //removes video element
                $('#shareContainer').removeChild($('#background'));
              // document.getElementById('shareContainer').removeChild(document.getElementById('background'));
                //clears the background
                // changeBackground();
                setButton(true);
              } else {
                webrtc.shareScreen(function (err,data) {
                  if (err) {
                    console.error(err);
                    setButton(true);
                  } else {
                    setButton(false);
                  }
                });
              }
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
          scope.$broadcast('screenshare');
        });

        // Handles addition of peer/remote videos
        webrtc.on('videoAdded', function (video, peer) {
            //if someone is sharing their screen, change background to that video
            if (peer.type === 'screen') {
             // changeBackground(video);
             console.log('do the thing');
             // disable sharing button for others
             shareButton.disabled = 'disabled';
            } else {
              var remotes = angular.element($('#remoteVideos'));
              if (remotes) {
                  var container = document.createElement('div');
                  console.log(container);
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
             // re-enables share button now that sharing is done
             shareButton.disabled = 0;

            } else {
              var remotes = angular.element($('#remoteVideos'));
              var options = (function(){return peer ? 'container_' + webrtc.getDomId(peer) : 'localScreenContainer';})();
              var el = angular.element($('#' + options));              if (remotes && el) {
                  remotes.removeChild(el);
              }
            }
        });

      }
    };
});