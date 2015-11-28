//TODO - refactor, decouple, and emit events on changing to different backgrounds

/* BACKGROUND SWAP FUNCTIONALITY */

//selecting the bgCanvas and canvas
var bgCanvas = document.getElementById('bg');
var drawCanvas = document.getElementById('whiteboard');
//select toggleBg button
var toggleBg = $('#toggleBg');

//select clear button
var clear = $('#clear');

//selects canvas contexts
var bgContext = bgCanvas.getContext('2d');
var drawContext = drawCanvas.getContext('2d');
App.background = 'light';

// on initialize, changes background image to default
//create new Image
var image = new Image();
//blackboard image - to be changed - using this image for testing

image.src = './images/light.jpg';

//when image is loaded, draws it onto the canvas
image.onload = function() {
  changeBackground(image);
};

//clear board click handler
//clears the drawBoard
clear.click(function () {
  
  drawContext.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

});

//toggleBackground click handler - toggles Bg between light and dark
toggleBg.click(function () {
  //changes to dark background if current is light
  if (App.background === 'light') {
    image.src = './images/dark.jpg';
    App.background = 'dark';

    // changes h1 color
    $('h1').css('color','#fff');
    changeBackground(image);
  } else {
    //changes to light background if current is dark
    image.src = './images/light.jpg';
    App.background = 'light';

    // changes h1 color 
    $('h1').css('color','#000');
    changeBackground(image);
  }
});
//store the videotimeout to be cleared when done - globally accessible
var timeout;


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
    image.src = './images/light.jpg';
    changeBackground(image);
  }

}


/* SCREENSHOT FUNCTIONALITY */

// function that creates the download link and downloads the image
function download(canvas, filename) {

    /// create an "off-screen" anchor tag
    var downloadLink = document.createElement('a'),
        e;

    /// the key here is to set the download attribute of the a tag
    downloadLink.download = filename;

    /// convert canvas content to data-uri for link. When download
    /// attribute is set the content pointed to by link will be
    /// pushed as "download" in HTML5 capable browsers
    downloadLink.href = canvas;

    /// create a "fake" click-event to trigger the download
    if (document.createEvent) {

        e = document.createEvent("MouseEvents");
        e.initMouseEvent("click", true, true, window,
                         0, 0, 0, 0, 0, false, false, false,
                         false, 0, null);

        downloadLink.dispatchEvent(e);

    } else if (downloadLink.fireEvent) {

        downloadLink.fireEvent("onclick");
    }
}

// on click handler for screenshot
$('#screenshot').click(function() {
  //creates offscreen canvas ('screenshot')
  var printCanvas=document.createElement('canvas');
  var printCtx=printCanvas.getContext('2d');

  // set to canvas width/height
  printCanvas.width = bgCanvas.width;
  printCanvas.height = bgCanvas.height;

  // recreate seamless pattern
  var pattern = printCtx.createPattern(bgCanvas, 'repeat');

  printCtx.rect(0, 0, bgCanvas.width, bgCanvas.height);
  printCtx.fillStyle = pattern;
  printCtx.fill();

  // draw the whiteboard marks over it
  printCtx.drawImage(drawCanvas, 0,0);

  // creating new image for download
  var img = new Image();
  img.onload=function(){
      // print this snapshot image
  };

  // format
  img.src = printCanvas.toDataURL("image/jpeg", 0.9);

  // download
  download(img.src, 'untitled.jpg');
});

