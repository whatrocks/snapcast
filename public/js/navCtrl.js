angular.module('snapcast')
.controller('navCtrl', function($scope) {
  // handles toggleBg button click
  $scope.toggleBg = function() {
    $scope.$broadcast('toggleBg');
  };
  // handles snapshot button click
  $scope.snapshot = function() {
    $scope.$broadcast('snapshot');
  };
  // handles clear button click
  $scope.clear = function() {
    $scope.$broadcast('clear');
  };

  $scope.faceshare = function() {
    $scope.$broadcast('faceshare');
  };

  $scope.shareDisabled = false;

});