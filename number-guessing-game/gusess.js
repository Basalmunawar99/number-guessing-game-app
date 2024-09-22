const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // or your XAMPP username
  password: '', // or your XAMPP password
  database: 'playergames' // replace with your database name
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database!');
});

var currentPlayer;
var currentGame;

function register() {
  readline.question("Enter a nickname: ", function (nickname) {
    readline.question("Enter a username: ", function (username) {
      readline.question("Enter a password: ", function (password) {
        db.query('INSERT INTO players SET ?', {
          nickname: nickname,
          username: username,
          password: password
        }, function (err, results) {
          if (err) {
            console.log("Username already taken. Try again.");
            register();
          } else {
            console.log("Account created successfully!");
            login();
          }
        });
      });
    });
  });
}

function login() {
  readline.question("Enter your username: ", function (username) {
    readline.question("Enter your password: ", function (password) {
      db.query('SELECT * FROM players WHERE username = ? AND password = ?', [username, password], function (err, results) {
        if (err || results.length === 0) {
          console.log("Invalid username or password. Try again.");
          login();
        } else {
          currentPlayer = results[0];
          console.log(`Welcome, ${currentPlayer.nickname}!`);
          showMainMenu();
        }
      });
    });
  });
}

function showMainMenu() {
  console.log("Main Menu:");
  console.log("1. Summary of games played");
  console.log("2. Start new game");
  console.log("u. Update account data");
  console.log("d. Delete account");
  console.log("x. Quit program");
  readline.question("Enter your choice: ", function (input) {
    switch (input) {
      case "1":
        showGameSummary();
        break;
      case "2":
        startNewGame();
        break;
      case "u":
        updateAccountData();
        break;
      case "d":
        deleteAccount();
        break;
      case "x":
        console.log("Goodbye!");
        readline.close();
        break;
      default:
        console.log("Invalid choice. Try again.");
        showMainMenu();
    }
  });
}

function showGameSummary() {
  db.query('SELECT * FROM games WHERE player_id = ?', [currentPlayer.id], function (err, results) {
    if (err) {
      console.log("Error fetching game summary.");
    } else {
      console.log("Game Summary:");
      results.forEach(function (result) {
        console.log(`Game started at ${result.started_at} and ended at ${result.ended_at} with ${result.num_guesses} guesses`);
      });
      showMainMenu();
    }
  });
}

function startNewGame() {
  db.query('INSERT INTO games SET ?', {
    player_id: currentPlayer.id,
    started_at: new Date()
  }, function (err, results) {
    if (err) {
      console.log("Error starting new game.");
    } else {
      currentGame = results.insertId;
      console.log("New game started!");
      showWelcome();
    }
  });
}

function showWelcome() {
  console.log("Welcome to the Number Guessing Game!");
  console.log("I have selected a number between 1 and 100");
  console.log("Can you guess what it is?");

  var randomNumber = Math.floor(Math.random() * 100) + 1;
  guessNumber(randomNumber);
}

function guessNumber(randomNumber) {
  readline.question("Guess the number: ", function (input) {
    var guess = parseInt(input);
    if (isNaN(guess) || guess < 1 || guess > 100) {
      console.log("Enter a number between 1 to 100");
      guessNumber(randomNumber);
    } else {
      db.query('INSERT INTO guesses SET ?', {
        game_id: currentGame,
        guess: guess,
        timestamp: new Date()
      }, function (err, results) {
        if (err) {
          console.log("Error saving guess.");
        } else {
          if (guess === randomNumber) {
            console.log(" Congratulations! You guessed the number!");
            endGame();
          } else {
            console.log("Try again!");
            guessNumber(randomNumber);
          }
        }
      });
    }
  });
}

function endGame() {
  db.query('UPDATE games SET ended_at = ? WHERE id = ?', [new Date(), currentGame])};