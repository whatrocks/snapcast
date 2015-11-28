//TODO - refactor for functionality

//selecting the bgCanvas and canvas
var bgCanvas = document.getElementById('bg');
var drawCanvas = document.getElementById('whiteboard');
//select toggleBG button
var changeBG = $('#changeBG');
//select clear button
var clear = $('#clear');

//select canvas contexts
var bgContext = bgCanvas.getContext('2d');
var drawContext = drawCanvas.getContext('2d');

//TODO - undo hardcoding
//create new Image
var image = new Image();

//blackboard image - to be changed - using this image for testing
image.src = 'http://orig11.deviantart.net/41f8/f/2013/180/1/2/blackboard_texture_2_by_allthingsprecious-d6bab3c.jpg';

//when image is loaded, draws it onto the canvas
image.onload = function() {
  changeBackground(image);
};

//store the videotimeout to be cleared when done - globally accessible
var timeout;

//TODO: toggleBG click handler

//clear board click handler
clear.click(function() {
  
  drawContext.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

});

function changeBackground(element) {
//if it was a video, stop the video from running
  if (timeout) { clearTimeout(timeout); }
  //clear the bgCanvas
  bgContext.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  
  //checks if element is a video
  if (element) {
   if (element.tagName === 'VIDEO') {
      //draws the element at 30fps
      (function loop() {
          bgContext.drawImage(element, 0, 0);
          timeout = setTimeout(loop, 1000 / 30);
      })();
    } else if (element.tagName === 'IMG') {
        bgContext.drawImage(image, 0, 0);
    }
  }

}
/*
default background = white
current background = current bg (sockets*)

when a background is changed, 
change image.src
clear and redraw

when someone screenshares,
send a screenshare event to everyone
append the screenshare video to a #screenshare element
draw the element as the background

*/
