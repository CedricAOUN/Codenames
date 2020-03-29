var express = require("express");
var app = express();
// var path = require("path");
var fs = require("fs");
// var bodyParser = require('body-parser')
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var xl = require('node-xlsx').default;
var wordlist = require('./log-custom');
var PORT = process.env.PORT || 3000;



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
var redAmount = 0;
var blueAmount = 0;

io.on('connection', function(socket){
  connections++
   //Set already team selected users in a team.
   
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
  function UserFromId(sockid){
    for(var i=0; i<users.length; i++){
      if(users[i].id == sockid){
        return users[i].name
      }
    }
  }
  function teamFromId(sockid){
    for(var i=0; i<users.length; i++){
      if(users[i].id == sockid){
        return users[i].team
      }
    }
  }
  socket.on('disconnect', function(){
    connections--
    socket.broadcast.emit('remove user', usernameAuth(users));
    if(connections == 0){
      currentGame = undefined
    }
    if(teamFromId(`${socket.id}`) == 'red'){
      redAmount--
      console.log('GREENGO LEFT');
      users.splice(userIndexAuth(users), 1);
      if(redAmount < 2 && redAmount < 2){
        console.log('GREENGO LEFT AND RED AMOUNT AINT 2');
        io.emit('wait', 'Please Wait For Enough Players (2 on Each Team)');
      }
    } else if(teamFromId(`${socket.id}`) == 'blue') {
      blueAmount-- 
      console.log('ORANGO LEFT');
      users.splice(userIndexAuth(users), 1);
      if(blueAmount < 2 && redAmount < 2){
        io.emit('wait', 'Please Wait For Enough Players (2 on Each Team)');
      }
    }
    
  });

  if(redAmount < 3 && blueAmount < 3){
    io.emit('wait', 'Please Wait For Enough Players (2 on Each Team)');
  }
  

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
    if(username == userExistCheck(users, username)){
      socket.emit('error log', {msg: `Username '${username}' already exists.`, type: 'error'});
    } else if(username == '') {
      socket.emit('error log', {msg: `Type something atleast you stingy fuck.`, type: 'error'});
    }  else if(username.length > 20) {
      socket.emit('error log', {msg: `Wen rayi7 habibe? Ayre bbahltak(Max Characters: 20)`, type: 'error'});
    } else if(username.includes(' ')) {
      socket.emit('error log', {msg: `Spaces break the code for some reason...DON'T USE THEM LUCA`, type: 'error'});
    } else {
    user = {name: username, id: socket.id, teamSelected: false, team: '', spymaster: false};
    users.push(user);
    }
  });

  //Authenticate the user, Handle the selected team
  socket.on('team select', function(team){
    for (var i=0; i<users.length; i++) {
      if(users[i].teamSelected){
        socket.emit('team select', {name: users[i].name, team: users[i].team});
        if(currentGame != undefined){
          io.to(`${socket.id}`).emit('game screen', currentGame);
          // io.to(`${socket.id}`).emit('wait');
        }
      }
    }
    var dataObj = {}
      if (team == 'blue') { //if blue team
      dataObj.name = usernameAuth(users);
      dataObj.team = 'blue';
      users[userIndexAuth(users)].teamSelected = true;
      users[userIndexAuth(users)].team = 'blue';
      io.emit('team select', dataObj);
      socket.emit('game screen', currentGame);
      } else if (team == 'red') { //if red team
      dataObj.name = usernameAuth(users);
      dataObj.team = 'red';
      users[userIndexAuth(users)].teamSelected = true;
      users[userIndexAuth(users)].team = 'red';
      io.emit('team select', dataObj);
      socket.emit('game screen', currentGame);
      }
  }); //socket team select
  
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

  socket.on('blue spy clicked', function(data){
    io.emit('blue spy clicked', data);
  });

  socket.on('red spy clicked', function(data){
    io.emit('red spy clicked', data);
  });

  socket.on('spymaster chosen', function(data){
    //SORT TEAMS IN ARRAYS
    var redTeam = [];
    var blueTeam = [];
    users.forEach(element => {
      if(element.team == 'red') {
        redTeam.push(element.name);
      } else {
        blueTeam.push(element.name);
      }
    });
    //SELECT RANDOM TEAM MEMBER
    var r = Math.floor(Math.random() * redTeam.length);
    var b = Math.floor(Math.random() * blueTeam.length);
    var randomRedID = users[userIndexGet(redTeam[r])].id;
    var randomBlueID = users[userIndexGet(blueTeam[b])].id;
    var randomRedUser = users[userIndexGet(redTeam[r])].name;
    var randomBlueUser = users[userIndexGet(blueTeam[b])].name;
    console.log(randomBlueID, randomRedID);
    console.log(UserFromId(randomRedID));
    // MANUAL RED SPY SETTING
    if(data.type == 'manual' && data.team == 'red'){
      io.to(`${socket.id}`).emit('set as spymaster');
      io.emit('spymaster chosen', {team: 'red', name: UserFromId(socket.id)})
    // MANUAL BLUE SPY SETTING
    } else if (data.type == 'manual' && data.team == 'blue'){
      io.to(`${socket.id}`).emit('set as spymaster');
      io.emit('spymaster chosen', {team: 'blue', name: UserFromId(socket.id)})
    // RANDOM RED SPY SETTING
    } else if (data.type == 'random' && data.team == 'red') {
      io.to(`${randomRedID}`).emit('set as spymaster');
      io.emit('spymaster chosen', {team: 'red', name: randomRedUser})
    // RANDOM BLUE SPY SETTING
    } else if (data.type == 'random' && data.team == 'blue') {
      io.to(`${randomBlueID}`).emit('set as spymaster');
      io.emit('spymaster chosen', {team: 'blue', name: randomBlueUser})
    }
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
    io.emit('shuffle clicked');
  });

  socket.on('Player Amount', function(data){
    if(data == 'red'){
      redAmount++
      if(blueAmount >= 2 && redAmount >= 2) {
        io.emit('Enough Players');
      }
    } else if(data == 'blue'){
      blueAmount++
      if(blueAmount >= 2 && redAmount >= 2) {
        io.emit('Enough Players');
      }
    }
  });

  io.emit('Team Amounts', {red: redAmount, blue: blueAmount});
  // socket.on('shuffle spymaster', function(team){
  //   var redTeam = [];
  //   var blueTeam = [];
  //   users.forEach(element => {
  //     if(element.team == 'red') {
  //       redTeam.push(element.name);
  //     } else {
  //       blueTeam.push(element.name);
  //     }
  //   });

  //   if(team == 'red'){
  //     var b = Math.floor(Math.random() * redTeam.length);
  //     io.to(`${users[userIndexGet(redTeam[b])].id}`).emit('become spymaster', 'red');
  //     io.emit('red spymaster css', redTeam[b]);
  //   } else if (team == 'blue'){
  //     var c = Math.floor(Math.random() * blueTeam.length);
  //     io.to(`${users[userIndexGet(blueTeam[c])].id}`).emit('become spymaster', 'blue');
  //     io.emit('blue spymaster css', blueTeam[c]);
  //   }
  // });
  // socket.on('game ready check', function(team){
  //   if(team == 'red'){
  //     redReady = true;
  //   } else if(team == 'blue') {
  //     blueReady = true;
  //   }

  //   if(blueReady && redReady){
  //     io.emit('game ready')
  //   }
  // })
  socket.on('hide wait', function(){
    socket.emit('hide wait');
  });
  
}); //socket connection


http.listen(PORT, function(){
  console.log('listening on http://localhost:3000');
});


