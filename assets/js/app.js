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
    gameStart: dB.ref('/gamestart'),
    playersRef: dB.ref('players'),
    p1Ref: dB.ref('/players/p1'),
    p2Ref: dB.ref('/players/p2'),
    turnRef: dB.ref('/turn'),
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
    playerName: '',
    gameStart: false,
    chatName: '',
    currentTurn: 0,
    playerNum: 0
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
    $title: $('.title'),
    $modal: $('#modal1'),
    $nameForm: $('#name-form'),
    $p1Wins: $('#p1-wins'),
    $p2Wins: $('#p2-wins'),
    $p1Action: $('.p1-action'),
    $p2Action: $('.p2-action'),
    $gameStatus: $('.game-status'),
    $p1Card: $('.p1-card'),
    $p2Card: $('.p2-card')
  }



  return {
    getCacheDOM: function () {
      return cacheDOM;
    },

    displayPlayerContent: function (name, selector) {
      selector.text(name);
    },

    // Displays 'waiting for...' in the player content card
    displayWaiting: function (selector, player) {
      let html = `<p>Waiting for Player ${player}...</p>`
      selector.empty();
      selector.append(html);
    },

    displayPlayerScore: function (selector) {
      let html = `<p>Wins: <span id="p1-wins">0</span></p><p>Losses: <span id="p1-losses">0</span></p>`
      selector.empty();
      selector.append(html);
    },

    displayChoices: function (player) {
      let pNum = player;
      let html = `<a class="waves-effect waves-light btn rock-btn hoverable" data-choice="rock">Rock</a><a class="waves-effect waves-light btn paper-btn hoverable" data-choice="paper">Paper</a><a class="waves-effect waves-light btn scissors-btn hoverable" data-choice="scissors">Scissors</a>`

      if (pNum === 1) {
        cacheDOM.$p1Action.append(html);
        cacheDOM.$p2Action.empty();
      } else if (pNum === 2) {
        cacheDOM.$p2Action.append(html);
        cacheDOM.$p1Action.empty();
      }
    },


    displayTurn: function (name) {
      cacheDOM.$gameStatus.text(`Your Turn, ${name}!`);
    },

    displayWaitingInGame: function (name) {
      cacheDOM.$gameStatus.text(`Waiting for ${name}'s selection...`);
    },

    changePlayerBg: function (pNum) {
      if (pNum === 1) {
        $p1Card.css('background-color', '#b2dfdb');
        $p2Card.css('background-color', '#fff')
      } else if (pNum === 2) {
        $p2Card.css('background-color', '#b2dfdb');
        $p1Card.css('background-color', '#fff');
      } else if (pNum === 3) {
        $p2Card.css('background-color', '#fff');
        $p1Card.css('background-color', '#fff');
      }
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
    dom.$startBtn.on('click', checkPlayerName)

  };



  const setupOnListeners = () => {


    dB.playersRef.on('value', (snap) => {

      gData.p1Presence = snap.child('p1').exists();
      gData.p2Presence = snap.child('p2').exists();

      gData.p1Data = snap.child('p1').val();
      gData.p2Data = snap.child('p2').val();

      gData.numPlayers = snap.numChildren();

      if (gData.numPlayers === 0) {
        dB.gameStart.set(false);
      }

      if (gData.numPlayers <= 2) {
        if (gData.p1Presence) {
          uiCtrl.displayPlayerContent(gData.p1Data.name, dom.$p1Header);
          uiCtrl.displayPlayerScore(dom.$p1Content);
        } else {
          uiCtrl.displayPlayerContent('Player 1', dom.$p1Header);
          uiCtrl.displayWaiting(dom.$p1Content, 1);
        }

        if (gData.p2Presence) {
          uiCtrl.displayPlayerContent(gData.p2Data.name, dom.$p2Header);
          uiCtrl.displayPlayerScore(dom.$p2Content);
        } else {
          uiCtrl.displayPlayerContent('Player 2', dom.$p2Header);
          uiCtrl.displayWaiting(dom.$p2Content, 2);
        }
        displayModal();
      }
    });



    // On listener if a chat message has been sent
    dB.chatRef.orderByChild('time').on('child_added', (snap) => {
      let chatObj = snap.val();
      let status = chatObj.status;
      let time = moment(chatObj.time).calendar()
      let html = `<p class='animated fadeIn chat-message holder'><span class='chat-name'>${chatObj.name}: </span>${chatObj.msg}<span class='chat-date'>${time}</span></p>`;

      if (status) {
        let newHtml = html.replace('holder', 'status-message')
        dom.$messages.append(newHtml);
      } else {
        dom.$messages.append(html);
      }
      dom.$messages.scrollTop(dom.$messages[0].scrollHeight);
    });



    dB.turnRef.on('value', (snap) => {
      gData.currentTurn = snap.val();

      if (gData.currentTurn === 1) {
        if (gData.playerNum === 1) {
          uiCtrl.displayChoices(1);
          uiCtrl.displayTurn(gData.p1Data.name);
          uiCtrl.changePlayerBg(1)
        } else {
          uiCtrl.displayWaitingInGame(gData.p1Data.name);
        }
      } else if (gData.currentTurn === 2) {
        if (gData.playerNum === 2) {
          uiCtrl.displayChoices(2);
          uiCtrl.displayTurn(gData.p2Data.name);
          uiCtrl.changePlayerBg(2);
        } else {
          uiCtrl.displayWaitingInGame(gData.p2Data.name);
        }
      } else {
        console.log('choices')
      }
    })


    dB.playersRef.on('child_added', (snap) => {
      if (gData.numPlayers === 1) {
        dB.turnRef.set(1);
      }
    })


  };




  const updateChatDb = (name, msg, status) => {
    let time = firebase.database.ServerValue.TIMESTAMP;

    dB.chatRef.push({
      name: name,
      msg: msg,
      time: time,
      status: status
    });
  }


  // Displays input field and directions depending on if game in progress or not
  const displayModal = () => {
    let gData = dataCtrl.getGameData();
    if (gData.numPlayers === 2) {
      dom.$modalHeader.text('Game in progress. Feel free to watch and chat until another player leaves.')
    } else {
      dom.$modalHeader.text('Enter Your Name')
    }

    if (gData.playerName.length === 0) {
      $('#modal1').modal({
        dismissible: false,
        onOpenStart() {
          outDuration: 300
        }
      })
      $('#modal1').modal('open');
    } else {
      $('#modal1').modal('close');
    }
  }



  // Adds message database
  const addChatMsg = () => {
    let msg = dom.$chatText.val();

    if (msg.length > 0) {
      updateChatDb(gData.chatName, msg, false)
      dom.$chatText.val('');
    }
  };



  const checkPlayerName = () => {
    var name = dom.$nameInput.val().trim();
    let gData = dataCtrl.getGameData();

    if (name.length > 0 && name.includes('/') === false) {
      dom.$startBtn.addClass('modal-close')
      gData.playerName = name;
      gData.chatName = name;
      dom.$nameInput.val('');
      assignPlayerName(gData.playerName);
    }
  }

  /*
  Assigns the username that is passed as an argument to the player 1 or 2 
  depending on the presence of the player in the game
  */
  const assignPlayerName = (name) => {
    let gData = dataCtrl.getGameData();
    let timeNow = Date.now();
    let dbDisconnect = firebase.database().ref('/chat/' + timeNow)
    if (gData.numPlayers < 2) {

      if (!gData.p1Presence) {

        gData.playerNum = 1;

        dB.p1Ref.set({
          name: name,
          wins: 0,
          losses: 0,
          choice: ''
        });

        dB.chatRef.push({
          name: name,
          msg: 'Has joined the game.',
          time: firebase.database.ServerValue.TIMESTAMP,
          status: true
        });

        dB.p1Ref.onDisconnect().remove()

        dbDisconnect.onDisconnect().set({
          name: name,
          msg: 'Has left from the game.',
          time: firebase.database.ServerValue.TIMESTAMP,
          status: true
        });

      } else if (!gData.p2Presence) {

        gData.playerNum = 2;

        dB.p2Ref.set({
          name: name,
          wins: 0,
          losses: 0,
          choice: ''
        });

        dB.chatRef.push({
          name: name,
          msg: 'Has joined the game.',
          time: firebase.database.ServerValue.TIMESTAMP,
          status: true
        });

        dB.p2Ref.onDisconnect().remove();
        dbDisconnect.onDisconnect().set({
          name: name,
          msg: 'Has left from the game.',
          time: firebase.database.ServerValue.TIMESTAMP,
          status: true
        })
      }
    } else if (gData.numPlayers === 2) {
      gData.playerName = 'Spectator';
      gData.chatName = name + ' (spectator)'
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