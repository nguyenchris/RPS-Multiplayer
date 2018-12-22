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
    p1Wins: dB.ref('p1Wins'),
    p2Wins: dB.ref('p2Wins')
  }

  let gameData = {
    p1Presence: false,
    p2Presence: false,
    p1Data: {},
    p2Data: {},
    p1Name: '',
    p2Name: '',
    p1Wins: 0,
    p2Wins: 0,
    p1Choice: '',
    p2Choice: '',
    numPlayers: 0,
    playerName: ''
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
    $modalHeader: $('.modal-header'),
    $sendBtn: $('.send-btn'),
    $chatText: $('#textarea2'),
    $messages: $('#messages'),
    $messageForm: $('#message-form'),
    $startBtn: $('.start-btn'),
    $nameInput: $('.name-input'),
    $p1Content: $('.p1-content'),
    $p2Content: $('.p2-content'),
    $p1Header: $('.player-1'),
    $p2Header: $('.player-2'),
    $title: $('.title')
  }



  return {
    getCacheDOM: function () {
      return cacheDOM;
    },

    displayPlayerContent: function (name, selector) {
      selector.text(name);
    },

    displayWaiting: function (player) {

    }
  }

})();







// Global App Controller
const appController = (function (dataCtrl, uiCtrl) {

  const dB = dataCtrl.getDbRef();
  const dom = uiCtrl.getCacheDOM();
  let gData = dataCtrl.getGameData();


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
      gData.playerName = dom.$nameInput.val().trim();

      if (gData.playerName.length > 0) {
        dom.$nameInput.val('');
        assignPlayerName(gData.playerName);
      }
    });
  };



  const setupOnListeners = () => {


    dB.playersRef.on('value', (snap) => {
      gData.p1Presence = snap.child('p1').exists();
      gData.p2Presence = snap.child('p2').exists();

      gData.p1Data = snap.child('p1').val()
      gData.p2Data = snap.child('p2').val()

      gData.numPlayers = snap.numChildren()

      displayModal();

      if (gData.p1Presence) {
        uiCtrl.displayPlayerContent(gData.p1Data.name, dom.$p1Header);
      }

      if (gData.p2Presence) {
        uiCtrl.displayPlayerContent(gData.p2Data.name, dom.$p2Header);
      }

    });


    ///// use this to display the disconnected alert in chat
    dB.playersRef.on('child_removed', (snap) => {


      console.log(snap.val())
    })



    // On listener if a chat message has been sent
    dB.chatRef.on('child_added', (snap) => {

      let html = `<span></span><p class='animated fadeIn chat-message'>${snap.val()}<span class='chat-date'></p>`;
      dom.$messages.append(html);
      dom.$messages.scrollTop(dom.$messages[0].scrollHeight);
    });
  };


  // Displays input field and directions depending on if game in progress or not
  const displayModal = function () {
    if (gData.numPlayers === 2) {
      dom.$modalHeader.text('Game in progress, feel free to watch.')
    } else {
      dom.$modalHeader.text('Enter Your Name')
    }
    // $('#modal1').modal();
    $('#modal1').modal({
      dismissible: false,
      onOpenStart() {
        outDuration: 300
      }
    })
    $('#modal1').modal('open');
  }



  // Adds message database
  const addChatMsg = () => {

    console.log(gData.playerName)
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

    if (gData.numPlayers < 2) {

      if (!gData.p1Presence) {
        dB.p1Ref.set({
          name: name,
          wins: 0,
          losses: 0,
          choice: ''
        });
        dB.p1Ref.onDisconnect().remove();
      } else if (!gData.p2Presence) {

        dB.p2Ref.set({
          name: name,
          wins: 0,
          losses: 0,
          choice: ''
        });
        dB.p2Ref.onDisconnect().remove();
      }

    } else {
      html = '<p>too many players</p>'
      $('.title').append(html);
    }
  };



  // const resetPlayerData



  return {

    init: function () {
      setupOnListeners();
      setupEventListeners();
    }
  }

})(dataController, uiController);

// Initalize App
appController.init();