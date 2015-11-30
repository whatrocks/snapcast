// # Whiteboard Angular Components

// ##### [Back to Table of Contents](./tableofcontents.html)

// Initialize the whiteboard module.

// Angular directive altered from pwambach's Angular-Canvas-Painter: 
// https://github.com/pwambach/angular-canvas-painter

angular.module('snapcast.whiteboard', [])
  // Set App to the root scope. 
// Directive for color selection
  .directive('kiColorSelector', function () {
    return {
      restrict: 'AE',
      scope: {
        colorList: '=kiColorSelector',
        selectedColor: '=color'
      },
      templateUrl: '../templates/color-selector.html',
      link: function(scope){
        scope.setColor = function(col){
          console.log('color selected');
          scope.selectedColor = col;
        };
      }
    };
  })
// Directive for the drawing functionality
  .directive('kiCanvas', function($window, socket) {
    return {
      restrict: 'AE',
      scope: {
        options: '=',
        version: '='
      },
      templateUrl: '../templates/canvas.html',
      link: function postLink(scope, elm) {

        var isTouch = !!('ontouchstart' in window);

        var PAINT_START = isTouch ? 'touchstart' : 'mousedown';
        var PAINT_MOVE = isTouch ? 'touchmove' : 'mousemove';
        var PAINT_END = isTouch ? 'touchend' : 'mouseup';
        
        var timeout;
        //set default options
        var options = scope.options || {};
        options.canvasId = options.customCanvasId || 'boardCanvas';
        options.tmpCanvasId = options.customCanvasId ? (options.canvasId + 'Tmp') : 'tmpCanvas';
        options.bgCanvasId = options.customCanvasId ? (options.canvasId + 'Bg') : 'bgCanvas';
        options.width = options.width || $window.innerWidth;
        options.height = options.height || $window.innerHeight;
        options.backgroundColor = options.backgroundColor || '#fff';
        options.color = options.color || '#000';
        options.undoEnabled = options.undoEnabled || false;
        options.opacity = options.opacity || 0.9;
        options.lineWidth = options.lineWidth || 1;
        options.undo = options.undo || false;
        options.imageSrc = options.imageSrc || './images/light.jpg';

        var loadImage = function(imageSrc) {

          var image = new Image();
          image.onload = function() {
            options.background = image;
            changeBackground(image);
          };
          image.src = imageSrc;
        };

        // loads default image
        if (options.imageSrc) {
          loadImage(options.imageSrc);
        }

        //undo
        if (options.undo) {
          var undoCache = [];
          scope.$watch(function() {
            return undoCache.length;
          }, function(newVal) {
            scope.version = newVal;
          });

          scope.$watch('version', function(newVal) {
            if (newVal < 0) {
              scope.version = 0;
              return;
            }
            if (newVal >= undoCache.length) {
              scope.version = undoCache.length;
              return;
            }
            undo(newVal);
          });
        }

        //create canvas and context
        var canvas = document.createElement('canvas');
        scope.canvas = canvas;
        canvas.id = options.canvasId;
        var canvasTmp = document.createElement('canvas');
        scope.canvasTmp = canvasTmp;
        canvasTmp.id = options.tmpCanvasId;
        var canvasBg = document.createElement('canvas');
        canvasBg.id = options.bgCanvasId;
        scope.canvasBg = canvasBg;


        angular.element(canvasTmp).css({
          position: 'absolute',
          top: 0,
          left: 0
        });
        angular.element(canvasBg).css({
          position: 'absolute',
          top: 0,
          left: 0,
          'z-index': -1
        });
        
        elm.find('div').append(canvas);
        elm.find('div').append(canvasBg);
        elm.find('div').append(canvasTmp);
        var ctx = canvas.getContext('2d');
        var ctxTmp = canvasTmp.getContext('2d');
        var ctxBg = canvasBg.getContext('2d');

        //init variables
        var point = {
          x: 0,
          y: 0
        };

        var ppts = [];

        //set canvas sizes
        canvas.width = canvasBg.width = canvasTmp.width = options.width;
        canvas.height = canvasBg.height = canvasTmp.height = options.height;

        //set context styles
        // ctx.fillStyle = options.backgroundColor;
        // ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctxTmp.globalAlpha = options.opacity;
        ctxTmp.lineJoin = ctxTmp.lineCap = 'round';
        ctxTmp.lineWidth = 10;
        ctxTmp.strokeStyle = options.color;

       
        //Watch options
        scope.$on('toggleBg', function(e) {
          if (scope.imageSrc === './images/light.jpg') {
            scope.imageSrc = './images/dark.jpg';

            // changes h1 color
            $('h1').css('color','#fff');
          } else {
            //changes to light background if current is dark
            scope.imageSrc = './images/light.jpg';

            // changes h1 color 
            $('h1').css('color','#000');
          }

            //loads the new image
            loadImage(scope.imageSrc);
        });

        scope.$on('screenshare', function(e) {
          console.log('whiteboard heard it');
          changeBackground($('#background'));
        });

        scope.$on('snapshot', function(e) {
          console.log('snap!');
          //creates offscreen canvas ('screenshot')
          var printCanvas = document.createElement('canvas');
          var printCtx = printCanvas.getContext('2d');

          // set to canvas width/height
          printCanvas.width = canvasBg.width;
          printCanvas.height = canvasBg.height;

          // recreate seamless pattern
          var pattern = printCtx.createPattern(canvasBg, 'repeat');

          printCtx.rect(0, 0, canvasBg.width, canvasBg.height);
          printCtx.fillStyle = pattern;
          printCtx.fill();

          // draw the whiteboard marks over it
          printCtx.drawImage(canvas, 0,0);

          // creating new image for download
          var img = new Image();
          img.onload=function(){
          };

          // format
          img.src = printCanvas.toDataURL("image/jpeg", 0.9);

          // download
          download(img.src, 'untitled.jpg');
        });

        scope.$on('clear', function() {
           socket.emit('clear');
           clearBoard();
        });

        scope.$watch('options.lineWidth', function(newValue) {
          if (typeof newValue === 'string') {
            newValue = parseInt(newValue, 10);
          }
          if (newValue && typeof newValue === 'number') {
            ctxTmp.lineWidth = options.lineWidth = newValue;
          }
        });

        scope.$watch('options.color', function(newValue) {
          if (newValue) {
            ctxTmp.strokeStyle = ctxTmp.fillStyle = newValue;
          }
        });

        scope.$watch('options.opacity', function(newValue) {
          if (newValue) {
            ctxTmp.globalAlpha = newValue;
          }
        });

        var getOffset = function(elem) {
          var offsetTop = 0;
          var offsetLeft = 0;
          do {
            if (!isNaN(elem.offsetLeft)) {
              offsetTop += elem.offsetTop;
              offsetLeft += elem.offsetLeft;
            }
            elem = elem.offsetParent;
          } while (elem);
          return {
            left: offsetLeft,
            top: offsetTop
          };
        };

        var setPointFromEvent = function(point, e) {
          if (isTouch) {
            point.x = e.changedTouches[0].pageX - getOffset(e.target).left;
            point.y = e.changedTouches[0].pageY - getOffset(e.target).top;
          } else {
            point.x = e.offsetX !== undefined ? e.offsetX : e.layerX;
            point.y = e.offsetY !== undefined ? e.offsetY : e.layerY;
          }
        };

        
        var paint = function(e) {

          if (e) {
            e.preventDefault();
            setPointFromEvent(point, e);
          }
          // Saving all the points in an array
          ppts.push({
            x: point.x,
            y: point.y
          });


          if (ppts.length === 3) {
            var b = ppts[0];
            ctxTmp.beginPath();
            ctxTmp.arc(b.x, b.y, ctxTmp.lineWidth / 2, 0, Math.PI * 2, !0);
            ctxTmp.fill();
            ctxTmp.closePath();
            return;
          }

          // Tmp canvas is always cleared up before drawing.
          ctxTmp.clearRect(0, 0, canvasTmp.width, canvasTmp.height);

          ctxTmp.beginPath();
          ctxTmp.moveTo(ppts[0].x, ppts[0].y);

          for (var i = 1; i < ppts.length - 2; i++) {

            var c = (ppts[i].x + ppts[i + 1].x) / 2;
            var d = (ppts[i].y + ppts[i + 1].y) / 2;
            ctxTmp.quadraticCurveTo(ppts[i].x, ppts[i].y, c, d);
          }

          // For the last 2 points
          ctxTmp.quadraticCurveTo(
            ppts[i - 1].x,
            ppts[i - 1].y,
            ppts[i].x,
            ppts[i].y
          );
          ctxTmp.stroke();

        };

        var copyTmpImage = function() {
          if (options.undo) {
            scope.$apply(function() {
              undoCache.push(ctx.getImageData(0, 0, canvasTmp.width, canvasTmp.height));
              if (angular.isNumber(options.undo) && options.undo > 0) {
                undoCache = undoCache.slice(-1 * options.undo);
              }
            });
          }
          canvasTmp.removeEventListener(PAINT_MOVE, paint, false);
          ctx.drawImage(canvasTmp, 0, 0);
          ctxTmp.clearRect(0, 0, canvasTmp.width, canvasTmp.height);
          ppts = [];
        };

        var copyRemoteImage = function(canvas) {
          var image = new Image();
          image.onload = function() {
            ctx.drawImage(this, 0, 0);
          };
          image.src = canvas;
        };

        var startTmpImage = function(e) {
          e.preventDefault();

          canvasTmp.addEventListener(PAINT_MOVE, paint, false);

          setPointFromEvent(point, e);
          ppts.push({
            x: point.x,
            y: point.y
          });
          ppts.push({
            x: point.x,
            y: point.y
          });

          paint();
        };
        
        var socketEvent = function() {
          var canvas = canvasTmp.toDataURL('image/png', 0.8);
          socket.emit('draw', canvas);
        };

        var initListeners = function() {
          canvasTmp.addEventListener(PAINT_START, startTmpImage, false);
          canvasTmp.addEventListener(PAINT_END, socketEvent, false);
          canvasTmp.addEventListener(PAINT_END, copyTmpImage, false);

          if (!isTouch) {
            var MOUSE_DOWN;

            document.body.addEventListener('mousedown', mousedown);
            document.body.addEventListener('mouseup', mouseup);

            scope.$on('$destroy', removeEventListeners);

            canvasTmp.addEventListener('mouseenter', mouseenter);
            canvasTmp.addEventListener('mouseleave', mouseleave);
          }

          function mousedown() {
            MOUSE_DOWN = true;
          }

          function mouseup() {
            MOUSE_DOWN = false;
          }

          function removeEventListeners() {
            document.body.removeEventListener('mousedown', mousedown);
            document.body.removeEventListener('mouseup', mouseup);
          }

          function mouseenter(e) {
            // If the mouse is down when it enters the canvas, start a path
            if (MOUSE_DOWN) {
              startTmpImage(e);
            }
          }

          function mouseleave(e) {
            // If the mouse is down when it leaves the canvas, end the path
            if (MOUSE_DOWN) {
              copyTmpImage(e);
            }
          }

        };

      // copies remote images received over sockets
        socket.on('draw', copyRemoteImage);
      
      //clears the board when someone clears it
        socket.on('clear', function() {
          scope.$apply(clearBoard);
        });

        var undo = function(version) {
          if (undoCache.length > 0) {
            ctx.putImageData(undoCache[version], 0, 0);
            undoCache = undoCache.slice(0, version);
          }
        };

        var changeBackground = function(newValue) {
         //Stops the rendering of video as background if needed
           if (timeout) { clearTimeout(timeout); }
           //Clears the background canvas
           ctxBg.clearRect(0, 0, canvasBg.width, canvasBg.height);
           
           //Renders according to type of element passed in
           if (newValue) {
            if (newValue.tagName === 'VIDEO') {
               //draws the element at 30fps
               (function loop() {
                   ctxBg.drawImage(canvasBg, 0, 0);
                   timeout = setTimeout(loop, 1000 / 30);
               })();
             } else if (newValue.tagName === 'IMG') {
               // Tiles the image for seamless texturing
               var pattern = ctxBg.createPattern(newValue, 'repeat');

               ctxBg.rect(0, 0, canvasBg.width, canvasBg.height);
               ctxBg.fillStyle = pattern;
               ctxBg.fill();

             }
           } else {
             // Defaults to whiteboard if no element specified
             var image = new Image();
             image.src = './images/light.jpg';
             changeBackground(image);
           }

        };
        
        var clearBoard = function() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        };

        var download = function (canvas, filename) {

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
        };

        initListeners();
 
      }
    };
  });