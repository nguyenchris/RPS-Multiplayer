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
  };

  // Local variables
  let gameData = {
    p1Presence: false,
    p2Presence: false,
    p1Data: {},
    p2Data: {},
    p1Name: '',
    p2Name: '',
    numPlayers: 0,
    playerName: '',
    gameStart: false,
    chatName: '',
    currentTurn: 0,
    playerNum: 0,
    pRef: ''
  };


  return {
    // Return dbRef object
    getDbRef: function () {
      return dbRef;
    },

    // Returns all game local variables
    getGameData: function () {
      return gameData;
    }
  };


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
    $p1Card: $('#p1-card'),
    $p2Card: $('#p2-card'),
    $p1Option: $('.p1-option'),
    $p2Option: $('.p2-option'),
    $progressBar: $('#progress-bar'),
    $playerRow: $('#player-row')
  };



  return {
    // Returns all DOM selectors
    getCacheDOM: function () {
      return cacheDOM;
    },

    // Displays player name
    displayPlayerContent: function (name, selector) {
      selector.text(name);
    },

    // Displays 'waiting for...' in the player content card
    displayWaiting: function (selector, player) {
      let html = `<p>Waiting for Player ${player}...</p>`
      selector.empty();
      selector.append(html);
    },

    // Displays and updates scores
    displayPlayerScore: function (selector, wins, losses) {
      let html = `<p class="#26a69a teal lighten-1">Wins: <span id="p1-wins">${wins}</span></p><p class="#c62828 red darken-3">Losses: <span id="p1-losses">${losses}</span></p>`
      selector.empty();
      selector.append(html);
    },

    // Display choice buttons
    displayChoices: function (player) {
      let pNum = player;
      let html = `<a class="waves-effect waves-light btn rock-btn hoverable option" data-choice="rock">Rock</a><a class="waves-effect waves-light btn paper-btn hoverable option" data-choice="paper">Paper</a><a class="waves-effect waves-light btn scissors-btn hoverable option" data-choice="scissors">Scissors</a>`

      if (pNum === 1) {
        cacheDOM.$p1Action.append(html);
        cacheDOM.$p2Action.empty();
      } else if (pNum === 2) {
        cacheDOM.$p2Action.append(html);
        cacheDOM.$p1Action.empty();
      }
    },

    // Display who's turn it is it in the game status header of game card
    displayTurn: function (name) {
      cacheDOM.$gameStatus.text(`Your Turn, ${name}!`);
    },

    // Displays waiting for certain player
    displayWaitingInGame: function (name) {
      cacheDOM.$gameStatus.text(`Waiting for ${name}'s selection...`);
    },

    // Change backgroud of player's card depending on turn
    changePlayerBg: function (pNum) {
      if (pNum == 1) {
        cacheDOM.$p1Card.css('background-color', '#b2dfdb');
        cacheDOM.$p2Card.css('background-color', '#fff');
      } else if (pNum == 2) {
        cacheDOM.$p2Card.css('background-color', '#b2dfdb');
        cacheDOM.$p1Card.css('background-color', '#fff');
      } else if (pNum == 3) {
        cacheDOM.$p2Card.css('background-color', '#fff');
        cacheDOM.$p1Card.css('background-color', '#fff');
      }
    },

    // Display the players' choices in the game card for animation
    displayPlayerChoice: function (player, choice) {

      let img = $("<img class='choice p" + player + "-choice'>").attr(
        'src',
        "assets/images/" + choice + ".jpg"
      );

      if (player == 1) {
        cacheDOM.$p1Option.append(img);
      } else {
        cacheDOM.$p2Option.append(img);
      }

    },

    // Displays who won
    displayResult: function (name) {
      cacheDOM.$gameStatus.text(`${name} Won!`);
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
    dom.$startBtn.on('click', checkPlayerName);

    // Click Listener to determine what choice the user selects
    $(document).on('click', '.option', function () {
      let choice = $(this).attr('data-choice');

      gData.pRef.child('choice').set(choice);

      $('.p' + gData.playerNum + '-action').empty();
      gData.currentTurn++
      dB.turnRef.set(gData.currentTurn);

    });

  };


  // Set up all Firebase .on listeners to determine changes in database
  const setupOnListeners = () => {

    // Determines changes in presence and determines how to proceed with the game
    dB.playersRef.on('value', (snap) => {

      gData.p1Presence = snap.child('p1').exists();
      gData.p2Presence = snap.child('p2').exists();

      gData.p1Data = snap.child('p1').val();
      gData.p2Data = snap.child('p2').val();

      gData.numPlayers = snap.numChildren();


      if (gData.p1Presence === false || gData.p2Presence === false) {
        dB.turnRef.set(0);
        dom.$p1Action.empty();
        dom.$p2Action.empty();
        dom.$progressBar.show();
      }

      if (gData.p1Presence === false && gData.p2Presence === false) {
        dom.$gameStatus.empty();
        dom.$gameStatus.text('Welcome!');
      }

      if (gData.numPlayers <= 2) {
        if (gData.p1Presence) {
          uiCtrl.displayPlayerContent(gData.p1Data.name, dom.$p1Header);
          uiCtrl.displayPlayerScore(dom.$p1Content, gData.p1Data.wins, gData.p1Data.losses);
        } else {
          uiCtrl.displayPlayerContent('Player 1', dom.$p1Header);
          uiCtrl.displayWaiting(dom.$p1Content, 1);
        }

        if (gData.p2Presence) {
          uiCtrl.displayPlayerContent(gData.p2Data.name, dom.$p2Header);
          uiCtrl.displayPlayerScore(dom.$p2Content, gData.p2Data.wins, gData.p2Data.losses);
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
        let newHtml = html.replace('holder', 'status-message');
        dom.$messages.append(newHtml);
      } else {
        dom.$messages.append(html);
      }
      dom.$messages.scrollTop(dom.$messages[0].scrollHeight);
    });


    // Listens for changes in the turn to determine what will occur after each player selects their choice
    dB.turnRef.on('value', (snap) => {
      gData.currentTurn = snap.val();

      if (gData.currentTurn === 1) {

        if (gData.playerNum === 1) {

          uiCtrl.displayChoices(1);
          uiCtrl.displayTurn(gData.p1Data.name);

        } else {
          uiCtrl.displayWaitingInGame(gData.p1Data.name);
        }

        uiCtrl.changePlayerBg(1);

      } else if (gData.currentTurn === 2) {

        if (gData.playerNum === 2) {

          uiCtrl.displayChoices(2);
          uiCtrl.displayTurn(gData.p2Data.name);

        } else {
          uiCtrl.displayWaitingInGame(gData.p2Data.name);
        }

        uiCtrl.changePlayerBg(2);

      } else if (gData.currentTurn === 3) {

        dom.$gameStatus.empty();

        uiCtrl.displayPlayerChoice(1, gData.p1Data.choice);
        uiCtrl.displayPlayerChoice(2, gData.p2Data.choice);

        setTimeout(checkGame, 900);

        setTimeout(nextRound, 4300);
      }
    });

    // If the 2nd player has entered the game, start the game
    dB.playersRef.on('child_added', (snap) => {
      if (gData.numPlayers === 1) {
        dB.turnRef.set(1);
        // uiCtrl.displayProgressBar(false);
        dom.$progressBar.hide();
      }
    });
  };


  // Game logic to determine which user won
  const checkGame = () => {
    if (gData.p1Data.choice === 'rock' && gData.p2Data.choice === 'rock') {
      tie();
    } else if (gData.p1Data.choice === 'paper' && gData.p2Data.choice === 'paper') {
      tie();
    } else if (gData.p1Data.choice === 'scissors' && gData.p2Data.choice === 'scissors') {
      tie();
    } else if (gData.p1Data.choice === 'rock' && gData.p2Data.choice === 'paper') {
      p2Won();
    } else if (gData.p1Data.choice === 'rock' && gData.p2Data.choice === 'scissors') {
      p1Won();
    } else if (gData.p1Data.choice === 'paper' && gData.p2Data.choice === 'rock') {
      p1Won();
    } else if (gData.p1Data.choice === 'paper' && gData.p2Data.choice === 'scissors') {
      p2Won();
    } else if (gData.p1Data.choice === 'scissors' && gData.p2Data.choice === 'rock') {
      p2Won();
    } else if (gData.p1Data.choice === 'scissors' && gData.p2Data.choice === 'paper') {
      p1Won();
    }
  };

  // Updates wins for player 1 and losses for player 2
  const p1Won = () => {
    uiCtrl.displayResult(gData.p1Data.name);

    if (gData.playerNum === 1) {
      dB.p1Ref.child('wins').set(gData.p1Data.wins + 1);
      dB.p2Ref.child('losses').set(gData.p2Data.losses + 1);
    }
  };

  // Updates wins for player 2 and losses for player 1
  const p2Won = () => {
    uiCtrl.displayResult(gData.p2Data.name);

    if (gData.playerNum === 2) {
      dB.p2Ref.child('wins').set(gData.p2Data.wins + 1);
      dB.p1Ref.child('losses').set(gData.p1Data.losses + 1);
    }
  };

  // Displays tie game
  const tie = () => {
    dom.$gameStatus.text('Tie!');
  };


  // Determines how to proceed with the turn database after a round ends
  const nextRound = () => {
    dom.$p1Option.empty();
    dom.$p2Option.empty();

    if (gData.p1Presence && gData.p1Presence) {
      dB.turnRef.set(1);
    } else {
      dB.turnRef.set(0);
    }
  };

  // Update chat database after a user disconnects/joins and enters a new message
  const updateChatDb = (name, msg, status) => {
    let time = firebase.database.ServerValue.TIMESTAMP;

    dB.chatRef.push({
      name: name,
      msg: msg,
      time: time,
      status: status
    });
  };


  // Displays input field and directions depending on if game in progress or not
  const displayModal = () => {
    let gData = dataCtrl.getGameData();
    if (gData.numPlayers === 2) {
      dom.$modalHeader.text('Game in progress. Feel free to watch and chat until another player leaves.')
    } else {
      dom.$modalHeader.text('Enter Your Name')
    }

    $('#modal1').modal({
      dismissible: false,
      onOpenStart() {
        outDuration: 300
      }
    })

    if (gData.numPlayers < 2 || gData.chatName.length === 0) {
      $('#modal1').modal('open');
    }
  };


  // Adds message database
  const addChatMsg = () => {
    let msg = dom.$chatText.val();

    if (msg.length > 0) {
      updateChatDb(gData.chatName, msg, false)
      dom.$chatText.val('');
    }
  };


  // Check to ensure user doesn't enter an empty string when the modal opens. 
  const checkPlayerName = () => {
    var name = dom.$nameInput.val().trim();
    let gData = dataCtrl.getGameData();

    if (name.length > 0 && name.includes('/') === false) {
      dom.$startBtn.addClass('modal-close');
      gData.playerName = name;
      gData.chatName = name;
      dom.$nameInput.val('');
      assignPlayerName(gData.playerName);
    }
  };

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

        gData.pRef = dB.p1Ref;

        dB.chatRef.push({
          name: name,
          msg: 'Has joined the game.',
          time: firebase.database.ServerValue.TIMESTAMP,
          status: true
        });

        dB.p1Ref.onDisconnect().remove()
        dB.playersRef.onDisconnect().remove()

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

        gData.pRef = dB.p2Ref;

        dB.chatRef.push({
          name: name,
          msg: 'Has joined the game.',
          time: firebase.database.ServerValue.TIMESTAMP,
          status: true
        });

        dB.p2Ref.onDisconnect().remove();
        dB.playersRef.onDisconnect().remove()
        dbDisconnect.onDisconnect().set({
          name: name,
          msg: 'Has left from the game.',
          time: firebase.database.ServerValue.TIMESTAMP,
          status: true
        })
      }
    } else if (gData.numPlayers === 2) {
      gData.playerName = '';
      gData.chatName = name + ' (spectator)'
    }
  };


  return {

    init: function () {
      setupOnListeners();
      setupEventListeners();
    }
  };

})(dataController, uiController);

// Initalize App
appController.init();