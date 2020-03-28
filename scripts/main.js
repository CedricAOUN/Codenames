const gamerTag = document.getElementById('gamer-tag');
const teamSelect = document.getElementById('team-select');
const next = document.getElementById('next');
const play = document.getElementById('play');
const tagBar = document.getElementById('tagBar');

//prevent form from refreshing the page
// var form = document.getElementById("myForm");
// function handleForm(event) { event.preventDefault(); } 
// form.addEventListener('submit', handleForm);

next.onclick = function() {
    gamerTag.style.display = 'none';
    teamSelect.style.display = 'inline-block';
}
document.getElementById('redButton').onclick = function() {
    teamSelect.style.display = 'none';
}
document.getElementById('blueButton').onclick = function() {
    teamSelect.style.display = 'none';
}

