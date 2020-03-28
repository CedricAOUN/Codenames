var express = require("express");
var app = express();
// var path = require("path");
var fs = require("fs");
// var bodyParser = require('body-parser')
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var xl = require('node-xlsx').default;
var wordlist = require('./log-custom');




app.use(express.static("style"));
app.use(express.static("scripts"));
app.use(express.static(__dirname));

// app.use(bodyParser.urlencoded({ extended: true }))




app.get('/', function(req, res) {
  res.setHeader('Content-Type', 'text/html')
  res.sendFile(__dirname + "/index.html");
});

// app.post('/', function(req, res){
//   console.log('test');
//   res.end();
// })

// app.post('/team-select', (req, res) => {
//   console.log(req.body.name);
//   res.sendFile(__dirname + '/team-select.html');
// })

const users = [];
var user;
var theUser;
var indexOfUser;
var connections = 0
var currentGame;
var Turns = ['blue','red'];
var currentTeam = 'blue';
var redReady = false;
var blueReady = false;

io.on('connection', function(socket){
  connections++
  console.log('there are '+ connections +' users connected');

   //Set already team selected users in a team.
   for (var i=0; i<users.length; i++) {
    if(users[i].teamSelected){
      socket.emit('team select', {name: users[i].name, team: users[i].team});
      if(currentGame != undefined){
        io.emit('game screen', currentGame);
      }
    }
  }
  //some functions to call
  function usernameAuth(array){
    for (var i=0; i< array.length; i++) {
      if(array[i].id == socket.id) {
        return users[i].name;
      }
    }  
  }; //user auth
  function userIndexAuth(array){
    for (var i=0; i< array.length; i++) {
      if(array[i].id == socket.id) {
        return i;
      }
    }    
  }; // index of a user in users
  function userExistCheck(array, nameParam){
    for (var i=0; i< array.length; i++) {
      if(array[i].name == nameParam) {
        return array[i].name;
      }
    } 
  }

  
  function tableCreate(words, size){
    var table = []
    for (var i=0; i< size; i++) {
      var word = words[Math.floor(Math.random() * words.length)]
      if(table.includes(word)){
        i--;
      } else {
      table.push(word);
      }   
    } return table;
  }
  
  function tableDefine(table){
    var definedTable = []
    for(var i=0; i< 8; i++){
      let template = {word: table[i], red: true, blue: false, death: false, regular: false};
      definedTable.push(template);
    }
    for(var i=8; i< 17; i++){
      let template2 = {word: table[i], red: false, blue: true, death: false, regular: false};
      definedTable.push(template2);
    }
    for(var i=17; i< 24; i++){
      let template3 = {word: table[i], red: false, blue: false, death: false, regular: true};
      definedTable.push(template3);
    }
    definedTable.push({word: table[24], red: false, blue: false, death: true, regular: false});  
    return definedTable;
  }

  //imported array shuffler
  function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
  }
  function userIndexGet(user) {
    for (var i=0; i<users.length; i++){
      if(users[i].name == user){
        return i
      }
    }
  }
  function UserFromId(theId){
    users.forEach(element => {
      if(element.id == theId){
        return element.name;
      }
    });
  }
  




  socket.on('disconnect', function(){
    connections--
    console.log('Someone Disconnected! There are '+ connections +' users connected now')
    socket.broadcast.emit('remove user', usernameAuth(users));
    console.log(usernameAuth(users) + ' disconnected');
    users.splice(userIndexAuth(users), 1);
    if(connections == 0){
      currentGame = undefined
    }
  });

  

  socket.on('new game', function(){
    var gameData = shuffle(tableDefine(tableCreate(wordlist[0].data, 25)));
    currentGame = gameData;
    currentTeam = 'blue';
    redReady = false;
    blueReady = false;
    io.emit('switch team', 'blue');
    io.emit('game screen', gameData);
    users.forEach(element => {
      if(element.team == 'red'){
        io.to(`${element.id}`).emit('red spymaster');
      } else if (element.team == 'blue') {
        io.to(`${element.id}`).emit('blue spymaster');
      }
    });
  });

  socket.on('button clicked', function(data){
    console.log('button' + data[1] + 'was clicked and its a ' + data[0]+ ' word');
    if(data[0] == 'death') {
      socket.broadcast.emit('update button', ['death', data[1]]);
    } else if(data[0] == 'regular') {
      socket.broadcast.emit('update button', ['regular', data[1]]);
      if(currentTeam == 'blue') {
        io.emit('switch team', 'red');
        currentTeam = 'red';
      } else {
        io.emit('switch team', 'blue');
        currentTeam = 'blue';
      }
    } else if(data[0] == 'red') {
      socket.broadcast.emit('update button', ['red', data[1]]);
      if(currentTeam == 'blue') {
        io.emit('switch team', 'red');
        currentTeam = 'red';
      }
    } else if(data[0] == 'blue'){
      socket.broadcast.emit('update button', ['blue', data[1]]);
      if(currentTeam == 'red'){
        io.emit('switch team', 'blue');
        currentTeam = 'blue';
      }
    }
  });
  
  //Create a user's object and add it to 'users'
  socket.on('username', function(username){
    console.log(username);
    if(username == userExistCheck(users, username)){
      socket.emit('error log', `Username '${username}' already exists.`);
    } else if(username == '') {
      socket.emit('error log', `Type something atleast you stingy fuck.`);
    } else if(username.length > 10) {
      socket.emit('error log', `Wen rayi7 habibe? Ayre bbahltak(Max Characters: 10)`);
    } else {
    user = {name: username, id: socket.id, teamSelected: false, team: '', spymaster: false};
    users.push(user);
    }
  });

  //Authenticate the user, Handle the selected team
  socket.on('team select', function(team){
  

    var dataObj = {}
      if (team == 'blue') { //if blue team
      dataObj.name = usernameAuth(users);
      dataObj.team = 'blue';
      users[userIndexAuth(users)].teamSelected = true;
      users[userIndexAuth(users)].team = 'blue';
      io.emit('team select', dataObj);
      socket.emit('game screen', currentGame);
      console.log(`${usernameAuth(users)} Chose Blue`);
      } else if (team == 'red') { //if red team
      dataObj.name = usernameAuth(users);
      dataObj.team = 'red';
      users[userIndexAuth(users)].teamSelected = true;
      users[userIndexAuth(users)].team = 'red';
      io.emit('team select', dataObj);
      socket.emit('game screen', currentGame);
      console.log(`${usernameAuth(users)} Chose Red`);
      }
  }); //socket team select
  

  //needs testing
  socket.on('game win', function(team){
    if(team == 'ORANGANG') {
      io.emit('game win', 'GREENGOS');
    } else {
      io.emit('game win', 'ORANGANG');
    }
  });

  socket.on('user disable', function(data){

    if(data == 'red') {
      users.forEach(element => {
        console.log(element.team);
        if(element.team == 'red') {
          io.to(`${element.id}`).emit('user disable');
        }
      });
    } else if(data == 'blue') {
      users.forEach(element => {
        if(element.team == 'blue') {
          io.to(`${element.id}`).emit('user disable'); 
        }  
      });
    }  
  });

  socket.on('user enable', function(data){
    if(data == 'red') {
      users.forEach(element => {
        if(element.team == 'red') {
          io.to(`${element.id}`).emit('user enable');
        }
      });
    } else if(data == 'blue') {
      users.forEach(element => {
        if(element.team == 'blue') {
          io.to(`${element.id}`).emit('user enable'); 
        }  
      });
    }  
  });

  socket.on('blue spy clicked', function(){
    io.emit('blue spy clicked');
  });

  socket.on('red spy clicked', function(){
    io.emit('red spy clicked');
  });


  socket.on('switch team', function(data){
    if(data == 'red'){
      io.emit('switch team', 'red');
    } else {
      io.emit('switch team', 'blue');
    }
  })

  socket.on('shuffle teams', function(){
    var a = Math.round(users.length / 2);
    var c = users.length 
    var randomUsers = []
      while(a != 0) {
        var b = users[Math.floor(Math.random() * users.length)].name
        a--
        if(randomUsers.includes(b)){
          a++
        } else {
          randomUsers.push(b)
        }
    }
    if(a == 0) {
      for (var i=0; i< users.length; i++){
        c--
        users[i].team = 'red'
      }
    }
    if(c == 0){
      for (var i=0; i< randomUsers.length; i++){
        users[userIndexGet(randomUsers[i])].team = 'blue'
      }
    }
    users.forEach(element => {
      io.emit('remove user', element.name);
      io.emit('team select', {name: element.name, team: element.team})
    });
  });

  socket.on('shuffle spymaster', function(team){
    var redTeam = [];
    var blueTeam = [];
    users.forEach(element => {
      if(element.team == 'red') {
        redTeam.push(element.name);
      } else {
        blueTeam.push(element.name);
      }
    });

    console.log(redTeam);
    console.log(blueTeam);
    if(team == 'red'){
      var b = Math.floor(Math.random() * redTeam.length);
      io.to(`${users[userIndexGet(redTeam[b])].id}`).emit('become spymaster', 'red');
      io.emit('error log', `${redTeam[b]} was randomed as Bachir Gemayel`);
    } else if (team == 'blue'){
      var c = Math.floor(Math.random() * blueTeam.length);
      io.to(`${users[userIndexGet(blueTeam[c])].id}`).emit('become spymaster', 'blue');
      io.emit('error log', `${blueTeam[c]} was randomed as Michel Aoun`);
    }
  });
  socket.on('game ready check', function(team){
    if(team == 'red'){
      redReady = true;
    } else if(team == 'blue') {
      blueReady = true;
    }

    if(blueReady && redReady){
      io.emit('game ready')
    }
  })

  
}); //socket connection


http.listen(3000, function(){
  console.log('listening on http://localhost:3000');
});


