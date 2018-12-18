// Initialize Firebase

var dataController = (function () {
  var config = {
    apiKey: "AIzaSyA5ZKHNiSCU3b4iZJa-XvVhUT6Pz2HmVNY",
    authDomain: "myfirstproject-d800f.firebaseapp.com",
    databaseURL: "https://myfirstproject-d800f.firebaseio.com",
    projectId: "myfirstproject-d800f",
    storageBucket: "myfirstproject-d800f.appspot.com",
    messagingSenderId: "339468865019"
  };

  firebase.initializeApp(config);

  var database = firebase.database();

})();




var chatController = (function () {

})();







var gameController = (function () {

})();








var uiController = (function () {

})();








var appController = (function (gmCtrl, uiCtrl, chCtrl) {



  return {

    init: function () {
      firebase.initializeApp(config);
    }
  }

})(dataController, chatController, gameController, uiController);


appController.init();