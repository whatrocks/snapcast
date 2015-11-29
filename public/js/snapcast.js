angular.module('snapcast', ['snapcast.whiteboard'])
  .factory('socket', ['$rootScope', '$window', function($rootScope, $window) {
    var ioRoom = $window.location.href;
    var socket = io.connect(ioRoom);
    
    return {
      on: function(eventName, callback){
        socket.on(eventName, callback);
      },
      emit: function(eventName, data) {
        socket.emit(eventName, data);
      }
    };
  }])
  .controller('MainCtrl', function($scope, socket) {

  });