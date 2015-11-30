angular.module('snapcast')
.controller('navCtrl', function($scope) {
  // handles toggleBg button click
  $scope.toggleBg = function() {
    $scope.$broadcast('toggleBg');
  };
});