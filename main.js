/*preparation*/
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext("2d");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

function hasTouchSupport() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}




let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let audioBuffer=[];
function preloadAudio(id){
    fetch(SOUND_MAP.get(id).src)
        .then(res => res.arrayBuffer())
        .then(data => audioCtx.decodeAudioData(data))
        .then(decoded => {
            audioBuffer.push(decoded);
            console.log(id + ' sound decoded and ready');
        });
}




//animation
function animate() {
  gameLoop();
  requestAnimationFrame(animate);
}

if (hasTouchSupport()) {
    console.log("Mobile device detected");
    setupTouchControls();
} else {
    console.log("Desktop device detected");
    const touchControls = document.getElementById('touch-controls');
    if (touchControls) {
        touchControls.remove();
    }
}


setUpControls();

loadImages()
    .then(() => loadSounds())
    .then(() => {
      console.log('images are loaded');
      console.log('sounds are loaded');
      preloadAudio('jump');
      SOUND_MAP.get('footsteps').loop = true;
      SOUND_MAP.get('footsteps').volume = 0.7;
      SOUND_MAP.get('jump').volume = 0.6;
      SOUND_MAP.get('hello').volume = 0.3;

      buildWorld();
      removeLoadingScreen();
      animate();
    });

