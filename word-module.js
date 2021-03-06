var socket = io();
var currentTeam = 'blue';
var currentGame;
var orangeScore = 9
var greenScore = 8
var redTeam;
var blueTeam;
var gameState = [];
var username;
var blueSpy;
var redSpy;
var spymaster = false;


var music1 = document.getElementById('hazit')
music1.volume = '0.1'
var music2 = document.getElementById('nezl')
music2.volume = '0.1'

function winCheck(){
if(orangeScore == 0) {
        socket.emit('game win', 'ORANGANG');
    } else if (greenScore == 0){
        socket.emit('game win', 'GREENGOS');
    }
}

function musicPlay(music, time) {
music.currentTime = time
music.play();
}
function musicStop(music) {
music.pause();
}
function dynamicFontSize(word, initialFontSize){
let length = word.length;
if(length >= 10) {
    return initialFontSize - length + 3
}
}
$('#red-spymaster-btn').click(function(){
    spymaster= true;
    socket.emit('spymaster chosen', {team: 'red', type: 'manual'});
    redSpy = true;
});
$('#blue-spymaster-btn').click(function(){
    spymaster= true;
    socket.emit('spymaster chosen', {team: 'blue', type: 'manual'});
    blueSpy = true;
});
$('#shuffle-blue-spy').click(function(){
    $('#shuffle-blue-spy').hide();
    $('#blue-spymaster-btn').hide();
    socket.emit('spymaster chosen', {team: 'blue', type: 'random'});
    blueSpy = true;
})
$('#shuffle-red-spy').click(function(){
    $('#shuffle-red-spy').hide();
    $('#red-spymaster-btn').hide();
    socket.emit('spymaster chosen', {team: 'red', type: 'random'});
    redSpy = true;
})

$('#shuffle-teams').click(function(){
    socket.emit('shuffle teams');
    $('#blue-spymaster-btn').hide();
    $('#red-spymaster-btn').hide();
    $('#shuffle-red-spy').hide();
    $('#shuffle-blue-spy').hide();
    socket.emit('new game');
    socket.emit('user disable', 'red');
    socket.emit('user disable', 'blue');
    socket.emit('hide wait');
});

$('#next').click(function(){
socket.emit('username', $('#tagBar').val());
username = $('#tagBar').val();
$('#gamer-tag').hide();
$('#team-select').show();
}); 
// RED
$('#redButton').click(function(){
    socket.emit('team select', 'red');
    $('#game-screen').show();
    $('#controls').show();
    $('#team-select').hide();
    socket.emit('Player Amount', 'red');
});
// BLUE
$('#blueButton').click(function(){
    socket.emit('team select', 'blue');
    $('#game-screen').show();
    $('#controls').show();
    $('#team-select').hide();
    socket.emit('Player Amount', 'blue');
});
// 
$('#new-game').click(function(){
    socket.emit('new game');
    console.log('test');
    socket.emit('user disable', 'red');
    socket.emit('user disable', 'blue');
    socket.emit('hide wait');
});
$('#next-turn').click(function(){
    if(currentTeam == 'red'){
        socket.emit('switch team', 'blue');
    } else {
        socket.emit('switch team', 'red');
    }
});

socket.on('team select', function(dataObj) {
    if(!$(`#---${dataObj.name}`).length) {
        if (dataObj.team == 'blue') {
            //add team to blue li
            $('#blue-list').append($(`<li class='tempuser' id="---${dataObj.name}">`).text(dataObj.name));
            $(`#---${dataObj.name}`).css('font-size', `${dynamicFontSize(dataObj.name, 29)}px`); 
        } else if(dataObj.team == 'red') {
            //add team to red li
            $('#red-list').append($(`<li class='tempuser' id="---${dataObj.name}">`).text(dataObj.name)); 
            $(`#---${dataObj.name}`).css('font-size', `${dynamicFontSize(dataObj.name, 29)}px`);     
        }
    }
});
socket.on('error log', function(sentError){
    $('body').append(`<div class="alert alert-warning" id="alerta" role="alert">${sentError.msg}</div>`)
    if(sentError.type == 'error') {
    $('#gamer-tag').show();
    $('#team-select').hide();
    }
    setTimeout(function(){ $('#alerta').remove() }, 3000); 
});
socket.on('game screen', function(data){
    socket.emit('user disable', 'blue');
    $('#choose').show();
    musicStop(music1);
    musicStop(music2);
    redSpy = false;
    blueSpy = false;
    $('.tempuser').css('color', 'white');
    currentGame = data;
    orangeScore = 9;
    greenScore = 8;
    $('#orange-score').val(orangeScore);
    $('#green-score').val(greenScore);
    $('#game').css("pointer-events", "none");
    $('.temp').remove();
    for(var i=0; i<5; i++){
        $('#row1').append($(`<li class='temp col ${wordType(currentGame[i])}' value='${wordType(currentGame[i])}' id=BID_${i}>${currentGame[i].word}</li>`));
    }
    for(var i=5; i<10; i++){
        $('#row2').append($(`<li class='temp col ${wordType(currentGame[i])}' value='${wordType(currentGame[i])}' id=BID_${i}>${currentGame[i].word}</li>`));
    }
    for(var i=10; i<15; i++){
        $('#row3').append($(`<li class='temp col ${wordType(currentGame[i])}' value='${wordType(currentGame[i])}' id=BID_${i}>${currentGame[i].word}</li>`));
    }
    for(var i=15; i<20; i++){
        $('#row4').append($(`<li class='temp col ${wordType(currentGame[i])}' value='${wordType(currentGame[i])}' id=BID_${i}>${currentGame[i].word}</li>`));
    }
    for(var i=20; i<25; i++){
        $('#row5').append($(`<li class='temp col ${wordType(currentGame[i])}' value='${wordType(currentGame[i])}' id=BID_${i}>${currentGame[i].word}</li>`));
    }
    $('#turn-label').show();
});

socket.on('switch team', function(data){
    if(data == 'blue'){
        $('#game').css({'border': '5px solid orange'});
        $('#turn-label').css('background-color', 'orange').text('ORANGANG TURN');
        currentTeam = 'blue'
        socket.emit('user enable', 'blue');
        socket.emit('user disable', 'red');
    } else {
        $('#game').css({'border': '5px solid green'});
        $('#turn-label').css('background-color', 'green').text('GREENGOS TURN');
        currentTeam = 'red'
        socket.emit('user enable', 'red');
        socket.emit('user disable', 'blue');
    }
});
socket.on('remove user', function(user){
$(`#---${user}`).remove();
});

function wordType(wordObject){
    if(wordObject.death){
        return 'death-word'
    } else if(wordObject.blue) {
        return 'orange-word'
    } else if(wordObject.red) {
        return 'green-word'
    } else {
        return 'regular-word'
    }
}
$("#word-list").click(function(event) {
    var target = $( event.target );
    $('#shuffle-teams').hide();
    for(var i=0; i<25; i++){
        if(target.attr('id') == `BID_${i}`){
            if(target.attr('value') == 'regular-word'){
            target.css( "background-color", "darkgray");
            target.css( "color", "black");
            target.css( "pointer-events", "none");
            socket.emit('button clicked', ['regular', `BID_${i}`]);
            console.log(gameState);
            } else if (target.attr('value') == 'orange-word') {

                //Handle Orange Score Win.
                if (orangeScore == 0) {
                    socket.emit('game win', 'blue');
                } else {
                    orangeScore-- 
                }
            winCheck();
            $('#orange-score').val(orangeScore);
            target.css( "background-color", "orange");
            target.css( "pointer-events", "none");
            socket.emit('button clicked', ['blue', `BID_${i}`]);
            } else if (target.attr('value') == 'green-word') {
                
                //Handle Green Score Win.
                if (greenScore == 0) {
                    socket.emit('game win', 'red');
                } else {
                    greenScore-- 
                }
            winCheck();
            $('#green-score').val(greenScore);
            target.css( "background-color", "green");
            target.css( "pointer-events", "none");
            socket.emit('button clicked', ['red', `BID_${i}`]);
            } else if(target.attr('value') == 'death-word'){

                //Handle Death Win.
                if (currentTeam == 'red') {
                    socket.emit('game win', 'ORANGANG');
                } else {
                    socket.emit('game win', 'GREENGOS');
                }

            target.css( "background-color", "black");
            socket.emit('button clicked', ['death', `BID_${i}`]);
            target.css( "pointer-events", "none");
            $('#game').css("pointer-events", "none");
            }
        }
    }
});

//updated buttons on other sockets
socket.on('update button', function(data){
    $('#shuffle-teams').hide();
    var passedTarget = $(`#${data[1]}`);
        if(data[0] == 'death'){
            passedTarget.css( "background-color", "black");
            passedTarget.css( "pointer-events", "none");
            $('#game').css("pointer-events", "none");
        } else if(data[0] == 'regular'){
            passedTarget.css( "pointer-events", "none");
            passedTarget.css( "background-color", "darkgray");
            passedTarget.css( "color", "black");
        } else if(data[0] == 'red') {
            greenScore--
            passedTarget.css( "pointer-events", "none");
            $('#green-score').val(greenScore);
            passedTarget.css({'color': 'white', 'background-color': 'green'});
        } else if(data[0] == 'blue') {
            orangeScore--
            passedTarget.css( "pointer-events", "none");
            $('#orange-score').val(orangeScore);
            passedTarget.css({'color': 'white', 'background-color': 'orange'});
        }
});

socket.on('game win', function(team){
    if(team == 'ORANGANG'){
        $('#game-win').text('GREENGOS WIN');
        $('#game-win').css('background-color', 'green');
        $('#game-win').show();
        musicPlay(music1, 15.9);
    } else {
        $('#game-win').text('ORANGANG WIN');
        $('#game-win').css('background-color', 'orange');
        $('#game-win').show();
        musicPlay(music2, 18.1);
    }
    setTimeout(function(){ $('#game-win').hide() }, 5000);
});   

socket.on('user disable', function(){
    $('#game').css("pointer-events", "none");
    $('#next-turn').hide();
});

socket.on('user enable', function(){
    $('#game').css("pointer-events", "auto");
    $('#next-turn').show();
    if(spymaster){
        $('#game').css("pointer-events", "none");
    }
});

socket.on('red spymaster', function(){
    $('#red-spymaster-btn').show();
    $('#shuffle-red-spy').show();
    $('#shuffle-teams').show();
    
});
socket.on('blue spymaster', function(){
    $('#blue-spymaster-btn').show();
    $('#shuffle-blue-spy').show();
    $('#shuffle-teams').show();
});




//Spymasters have their page updated with this.
socket.on('set as spymaster', function(){   
    $('#next-turn').hide();
    $('#blue-spymaster-btn').hide();
    $('#red-spymaster-btn').hide();
    $('#shuffle-red-spy').hide();
    $('#shuffle-blue-spy').hide();
    $('#game').css('pointer-events', 'none');
    $('.green-word').css({'color': '#0EB324', 'background-color': '#18241A', 'border': '3px solid green'});
    $('.regular-word').css({'color': 'black', 'background-color': 'white', 'border': '1px solid black'});
    $('.death-word').css({'background-color': 'black', 'border': '5px solid red'});
    $('.orange-word').css({'color': 'orange', 'background-color': '#18241A', 'border': '3px solid orange'});
});

//Everyone is informed who spymaster is, and controlls are removed.
socket.on('spymaster chosen', function(data){
    console.log(data.name);
    $(`#---${data.name}`).css('color', 'red');
    $('#shuffle-teams').hide();
    $('#game').css('pointer-events');
    if(data.team == 'red') {
        $(`#---${data.name}`).css('color', 'red');
        $('#red-spymaster-btn').hide();
        $('#shuffle-red-spy').hide();
        redSpy = true;
        if(redSpy && blueSpy){
            socket.emit('user enable', currentTeam);
            $('#choose').hide();
        }
    }
    else if(data.team == 'blue'){
        $(`#---${data.name}`).css('color', 'red');
        $('#blue-spymaster-btn').hide();
        $('#shuffle-blue-spy').hide();
        blueSpy = true;
        if(redSpy && blueSpy){
            socket.emit('user enable', currentTeam);
            $('#choose').hide();

        }
    }
    
});

socket.on('become spymaster', function(team){
    if(team == 'red') {
        $('#shuffle-teams').hide();
        $('#red-spymaster-btn').hide();
        $('#shuffle-red-spy').hide();
        $('#shuffle-red-spy').hide();
        $('#game').css('pointer-events', 'none');
        $('.green-word').css({'color': '#0EB324', 'background-color': '#18241A', 'border': '3px solid green'});
        $('.regular-word').css({'color': 'black', 'background-color': 'white', 'border': '1px solid black'});
        $('.death-word').css({'background-color': 'black', 'border': '5px solid red'});
        $('.orange-word').css({'color': 'orange', 'background-color': '#18241A', 'border': '3px solid orange'});
        $('#next-turn').hide();
    } else if(team == 'blue') {
        $('#shuffle-teams').hide();
        $('#blue-spymaster-btn').hide();
        $('#shuffle-blue-spy').hide();
        $('#shuffle-blue-spy').hide();
        $('#game').css('pointer-events', 'none');
        $('.green-word').css({'color': '#0EB324', 'background-color': '#18241A', 'border': '3px solid green'});
        $('.regular-word').css({'color': 'black', 'background-color': 'white', 'border': '1px solid black'});
        $('.death-word').css({'background-color': 'black', 'border': '5px solid red'});
        $('.orange-word').css({'color': 'orange', 'background-color': '#18241A', 'border': '3px solid orange'});
        $('#next-turn').hide();
    };
});

socket.on('game ready', function() {
    socket.emit('user enable', 'blue');
});

socket.on('shuffle clicked', function(){
    $('#blue-spymaster-btn').hide();
    $('#red-spymaster-btn').hide();
    $('#shuffle-red-spy').hide();
    $('#shuffle-blue-spy').hide();
});

socket.on('red spymaster css', function(data) {
    $(`.tempuser:contains('${data}')`).css('border', '5px solid red');
});
socket.on('blue spymaster css', function(data) {
    $(`.tempuser:contains('${data}')`).css('border', '5px solid red');
});

socket.on('Enough Players', function(){
    $('#wait').hide();
});

socket.on('wait', function(data){
    $('#choose').hide();
    $('#spinner').show();
    $('.controls').hide();
    $('#wait').show();
    $('#wait').text(data);
    $('#game').css('pointer-events', 'none');
});
socket.on('Enough Players', function(){
    $('#spinner').hide();
    $('#wait').hide();
    $('.controls').show();
    $('#choose').hide();
    $('#choose').css('color','white');
    socket.emit('user enable', currentTeam);
});
socket.on('Span Update', function(data){
    let redstr;
    let bluestr;
    if(data[0] > 1 || data[0] == 0) {
        redstr = 'players'
    } else {
        redstr = 'player'
    }
    if(data[1] > 1 || data[1] == 0) {
        bluestr = 'players'
    } else {
        bluestr = 'player'
    }
    $('#green-span').text(`(${data[0]} ${redstr})`);
    $('#orange-span').text(`(${data[1]} ${bluestr})`);
});
