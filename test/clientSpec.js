(function() {
  // Basic Integration testing, with some mock user activity.
  var expect = chai.expect;

//fakeDraw simulates an event of clicking and dragging on the canvas.
  var fakeDraw = function (startX, startY, endX, endY) {
    var d = $.Event('mousedown');
    var e = $.Event('drag');

    d.offsetX = startX;
    d.offsetY = startY;
    
    e.offsetX = endX;
    e.offsetY = endY;
    $('canvas').trigger(d);
    $('canvas').trigger(e);
    $('canvas').trigger('dragend');
  };

  describe('whiteboard', function() {
    beforeEach(function() {
      App.context.clearRect(0, 0, 20, 20);
    });

    it('should draw a mark on the board', function() {
      var marked = false;
      fakeDraw(0, 0, 5, 5);
      var imageData = App.context.getImageData(0, 0, 20, 20).data;
      for (var i = 0; i < imageData.length; i++) {
        marked = marked || imageData[i];
      }
      expect(marked).to.not.equal(0);
    });

    it('should change colors', function() {
      App.pen.strokeStyle = 'black';
      fakeDraw(0, 0, 5, 5);

      var imageDataBlack = App.context.getImageData(0, 0, 20, 20).data;
      
      App.context.clearRect(0, 0, 20, 20);

      App.pen.strokeStyle = 'red';
      fakeDraw(0, 0, 5, 5);

      var imageDataRed = App.context.getImageData(0, 0, 20, 20).data;

      var imageData = App.context.getImageData(0, 0, 20, 20).data;
      expect(_.isEqual(imageDataBlack, imageDataRed)).to.equal(false);
    });
  });
}());

//to add:

//drawing out of bounds doesnt add to board

//board persists on refresh

//board colors

//eraser works

//new board button works

