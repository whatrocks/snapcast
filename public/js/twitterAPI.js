var makeUserInput = function () {

var userInput = '<form style = "display: inline" ><input class = "sendInvite" type = "text" placeholder = "invite someone!" size = 15 ></form>';

  $('.twitterAPI').empty().html(userInput);

  $('.sendInvite').on("keypress", function(event){
    if(event.keyCode === 13){
      event.preventDefault();
      var thisButton = $(this);
      var targetuser = thisButton.val();
      thisButton.val('');
      $.ajax({
        url: '/sendInvite',
        method : 'POST',
        contentType: "application/json",
        data : JSON.stringify({username : targetuser, link : window.location.href}),
        success : function () {
          thisButton.attr({placeholder: 'invite sent!!!!!!!!!!!'});
        },
        error : function(){
          thisButton.attr({placeholder: 'error! check user name'});
        }
      });//done setting ajax
    }
  });//done event listening 
};//done defining makeUserInput

var makeLoginButton = function () {
  
  var loginButton = '<form style = "display: inline" action="/twitterSignIn" target="_top" method="get"><button>Twitter Login</button></form>';

  $('.twitterAPI').empty().html(loginButton);
  
};

var checkUserOAuth = function () {
  $.ajax({
    url: "/checkUserAuthSession",
    method: "GET",
    success: function () {
      makeUserInput();
    },
    error: function () {
      makeLoginButton();
    }
  });    
};

checkUserOAuth();
