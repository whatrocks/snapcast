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

// on initialize, changes background image to default
// TODO: undo hardcoding, emit events on changing to different backgrounds
//create new Image
var image = new Image();
//blackboard image - to be changed - using this image for testing
// image.src = 'http://powerpictures.crystalgraphics.com/photo/seamlessly_repeatable_dusty_old_chalkboard_texture_cg5p7114845c_th.jpg';
image.src = 'http://www.hyatts.com/eCom/images/F/F19996.jpg';
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
//Stops the rendering of video as background if needed
  if (timeout) { clearTimeout(timeout); }
  //Clears the background canvas
  bgContext.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  
  //Renders according to type of element passed in
  if (element) {
   if (element.tagName === 'VIDEO') {
      //draws the element at 30fps
      (function loop() {
          bgContext.drawImage(element, 0, 0);
          timeout = setTimeout(loop, 1000 / 30);
      })();
    } else if (element.tagName === 'IMG') {
      // Tiles the image for seamless texturing
      var pattern = bgContext.createPattern(element, 'repeat');

      bgContext.rect(0, 0, bgCanvas.width, bgCanvas.height);
      bgContext.fillStyle = pattern;
      bgContext.fill();

    }
  } else {
    // Defaults to whiteboard if no element specified
    var image = new Image();
    image.src = 'http://www.hyatts.com/eCom/images/F/F19996.jpg';
    changeBackground(image);
  }

}

