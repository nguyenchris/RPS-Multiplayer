// Initialize Firebase
const config = {
  apiKey: "AIzaSyA5ZKHNiSCU3b4iZJa-XvVhUT6Pz2HmVNY",
  databaseURL: "https://myfirstproject-d800f.firebaseio.com",
  projectId: "myfirstproject-d800f",
  storageBucket: "myfirstproject-d800f.appspot.com",
  messagingSenderId: "339468865019"
};

firebase.initializeApp(config);


// Data Controller
const dataController = (function () {

  // Firebase database reference
  const dB = firebase.database();

  // Object containing database references
  const dbRef = {
    chatRef: dB.ref('/chat'),
    playersRef: dB.ref('players'),
    p1Ref: dB.ref('/players/p1'),
    p2Ref: dB.ref('/players/p2'),
    turnRef: dB.ref('turn'),
    connectedRef: dB.ref(".info/connected"),
    connectionsRef: dB.ref("connections")
  }

  let gameData = {
    players: [],
    p1Presence: false,
    p2Presence: false,
    p1Name: '',
    p2Name: ''
  }


  return {

    // Return dbRef object
    getDbRef: function () {
      return dbRef;
    },

    getGameData: function () {
      return gameData;
    }
  }


})();




// UI Controller
const uiController = (function () {

  const cacheDOM = {
    $sendBtn: $('.send-btn'),
    $chatText: $('#textarea2'),
    $messages: $('#messages'),
    $messageForm: $('#message-form'),
    $startBtn: $('.start-btn'),
    $nameInput: $('.name-input')
  }

  return {
    getCacheDOM: function () {
      return cacheDOM;
    }
  }

})();







// Global App Controller
const appController = (function (dataCtrl, uiCtrl) {

  const dB = dataCtrl.getDbRef();
  const dom = uiCtrl.getCacheDOM();


  const setupEventListeners = () => {

    // Click event listener in order to add a new chat message
    dom.$sendBtn.on('click', addChatMsg);

    // Keypress event listener to add a new chat message
    dom.$messageForm.keypress((e) => {
      if (e.keyCode === 13 || e.which === 13) {
        e.preventDefault();
        addChatMsg();
      }
    });

    // Start button click event listener to add player to game
    dom.$startBtn.on('click', () => {

      let gD = dataCtrl.getGameData();
      let playerName = dom.$nameInput.val();

      if (playerName.length > 0) {
        gD.players.push(playerName)
        assignPlayerName(playerName);
      }
    });
  };



  const setupOnListeners = () => {

    // On listener for presence of players
    dB.playersRef.on('value', (snap) => {
      gData = dataCtrl.getGameData();

      gData.p1Presence = snap.child('p1').exists();
      gData.p2Presence = snap.child('p2').exists();
    });



    // On listener for if a chat message has been sent
    dB.chatRef.on('child_added', (snap) => {
      let html = `<p>${snap.val()}</p>`; /// need to figure out how to add name of player and time during append
      dom.$messages.append(html);
      dom.$messages.scrollTop(dom.$messages[0].scrollHeight);
    });
  };



  // Adds message to UI and database
  const addChatMsg = () => {

    let msg = dom.$chatText.val();

    if (msg.length > 0) {
      dB.chatRef.push(msg); /// need to figure out how to add name of player and time during push
      dom.$chatText.val('');
    }
  };


  /*
  Assigns the username that is passed as an argument to the player 1 or 2 
  depending on the presence of the player in the game
  */

  const assignPlayerName = (name) => {
    let gData = dataCtrl.getGameData();

    dB.connectedRef.on('value', (snap) => {
      if (snap.val() === true) {

        if (!gData.p1Presence) {

          gData.p1Name = name;

          dB.p1Ref.set({
            name: name
          });

          dB.p1Ref.onDisconnect().remove();

        } else if (!gData.p2Presence) {

          gData.p2Name = name;

          dB.p2Ref.set({
            name: name
          });

          dB.p2Ref.onDisconnect().remove();
        } else {
          html = '<p>too many players</p>'
          $('.title').append(html);
        }
      }
    });

  };



  return {

    init: function () {
      setupOnListeners();
      setupEventListeners();
    }
  }

})(dataController, uiController);

// Initalize App
appController.init();