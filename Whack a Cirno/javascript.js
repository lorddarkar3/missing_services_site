/* oNgnissiM 10/28/2024
    Adapted from https://javascript30.com/
    Whack a Mole
    Modifications and changes:
    Added background music during gameplay
    increased game time to a mininum of 30 seconds with a random time of up to one minute
    Increased mininum peek time from 2 seconds to 5 seconds
    renamed all moles/mole instances to cirnos/cirno
    Added transition start/end listeners to dynamicly change cirno's sprite based on her current action
*/

const holes = document.querySelectorAll('.hole');
const scoreBoard = document.querySelector('.score');
const cirnos = document.querySelectorAll('.cirno');
let lastHole;
let timeUp = false;
let score = 0;

let BGMusic = new Audio('audio/cirnotheme.opus')
BGMusic.loop = true;
BGMusic.volume = .25;

let baka = new Audio('audio/baka-cirno.mp3')
baka.volume = .5;
let bonkSound = new Audio('audio/bonk.mp3')

function randomTime(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

function randomHole(holes) {
    const idx = Math.floor(Math.random() * holes.length);
    const hole = holes[idx];
    if (hole === lastHole) {
        //console.log('Ah nah thats the same one bud');
        return randomHole(holes);
    }
    lastHole = hole;
    return hole;
}

function peep() {
    const time = randomTime(500, 1000);
    const hole = randomHole(holes);
    baka.currentTime = 0;
    baka.play();
    hole.classList.add('up');
    hole.classList.remove('bonked');
    setTimeout(() => {
        hole.classList.remove('up');
        if (!timeUp) peep();
    }, time);
}

function startGame() {
    BGMusic.play()
    scoreBoard.textContent = 0;
    timeUp = false;
    score = 0;
    peep();
    //setTimeout(() => timeUp = true, 10000)
    setTimeout(() => {
        timeUp = true;
        BGMusic.pause();
        BGMusic.currentTime = 0;
    }, randomTime(30000,60000))
}

function bonk(e) {
    if (!e.isTrusted) return; // cheater!
    score++;
    this.parentNode.classList.add('bonked');
    this.parentNode.classList.remove('up');
    scoreBoard.textContent = score;
    bonkSound.currentTime = 0;
    bonkSound.play();
}

cirnos.forEach(cirno => cirno.addEventListener('click', bonk));

function runSprite() {
    if (this.parentNode.classList.contains('up')) {
        this.style.backgroundImage = "url('images/rise.gif')";
    } else if (this.parentNode.classList.contains('bonked')) {
        this.style.backgroundImage = "url('images/fall.gif')";
    } else {
        this.style.backgroundImage = "url('images/descend.gif')";
    }
}
function endSprite() {
    if (this.parentNode.classList.contains('up')) {
        this.style.backgroundImage = "url('images/stand.gif')";
    }
}

cirnos.forEach(cirno => cirno.addEventListener('transitionrun',runSprite));
cirnos.forEach(cirno => cirno.addEventListener('transitionend',endSprite));