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
    // p1Ref: this.playersRef.child('p1'),
    // p2Ref: this.playersRef.child('p2'),
    turnRef: dB.ref('turn'),
    connectedRef: dB.ref(".info/connected"),
    connectionsRef: dB.ref("connections")
  }

  let gameData = {
    players: []
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
    $nameInput: $('#name-input'),
    $nameTextInput: $('#name_text_input')
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

    dom.$sendBtn.on('click', addChatMsg);

    dom.$messageForm.keypress((e) => {

      if (e.which === 13) {
        addChatMsg();
      }
    });


    dom.$startBtn.on('click', () => {


      let gD = dataCtrl.getGameData();

      let playerName = $('#name_text_input').val();
      console.log(playerName);

      if (playerName.length > 0 && gD.players.length <= 2) {

        console.log(playerName);

        // dB.connectedRef.on('value', (snap) => {
        //   if (snap.val()) {
        //     dB.connectionsRef.push(true);
        //     dB.connectionsRef.onDisconnect().remove();
        //   }
        // });

        checkPlayerAmt(playerName);

        // dB.playersRef.push()
      }

    })

  }



  const setupOnListeners = () => {

    // test
    dB.playersRef.set({
      name: 'Chris'
    })

    dB.chatRef.on('child_added', (snap) => {
      let html = `<p>${snap.val()}</p>`; /// need to figure out how to add name of player and time during append
      dom.$messages.append(html);
      dom.$messages.scrollTop(dom.$messages[0].scrollHeight)
    });



    // dB.connectedRef.on('value', (snap) => {
    //   if (snap.val()) {
    //     dB.connectionsRef.push(true);
    //     dB.connectionsRef.onDisconnect().remove();
    //   }
    // });

    // dB.connectionsRef.on('value', (snap) => {

    // })
  }



  const addChatMsg = () => {

    let msg = dom.$chatText.val();

    if (msg.length > 0) {
      dB.chatRef.push(msg); /// need to figure out how to add name of player and time during push
      dom.$chatText.val('');
    }
  }


  const checkPlayerAmt = () => {
    dB.connectedRef.on('value', (snap) => {
      if (snap.val()) {
        console.log(playerName);
      }
    });
  }



  return {

    init: function () {
      setupOnListeners();
      setupEventListeners();
    }
  }

})(dataController, uiController);

// Initalize App
appController.init();