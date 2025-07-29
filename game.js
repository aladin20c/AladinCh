const Game = {
    imagesLoaded : false,
    imageMap : new Map(),
    keys : new Map(),
    canvasWidth : 1024,
    canvasHeight : 650,
    ground:892,
    gravity:0.7,
    camera : null,
    player : null,
    objects : [],
    sprites : [],
};

function loadImages() {
    const container = document.getElementById('images');
    if (!container) {
        console.warn(`Container with ID "images" not found.`);
        return;
    }
    const images = container.querySelectorAll('img[id]');
    let loadedCount = 0;
    const totalImages = images.length;

    if (totalImages === 0) {
        Game.imagesLoaded = true;
        return;
    }

    images.forEach(img => {
        const id = img.id;
        Game.imageMap.set(id, img);

        if (img.complete && img.naturalWidth !== 0) {
            // Already loaded
            loadedCount++;
            if (loadedCount === totalImages) {
                Game.imagesLoaded = true;
            }
        } else {
            img.addEventListener('load', () => {
                loadedCount++;
                if (loadedCount === totalImages) {
                    Game.imagesLoaded = true;
                }
            });
            img.addEventListener('error', () => {
                console.warn(`Failed to load image with ID "${id}"`);
                loadedCount++;
                if (loadedCount === totalImages) {
                    Game.imagesLoaded = true;
                }
            });
        }
    });
}

function setUpControls(){
    window.addEventListener('keydown', (event) => {
        Game.keys.set(event.key, true);
    });
    window.addEventListener('keyup', (event) => {
        Game.keys.set(event.key, false);
    });




/*Smarthphone touchScreen controls
if smn touches the left part of the screen than the player goes left and if the roght side is touched than the player goes right
var rightTouch = false;
var leftTouch = false;

canvas.addEventListener("touchstart", (event) => {
   var width = document.body.clientWidth;
  clientX = event.touches[0].clientX;
  if(clientX < width/2){
    rightTouch=false;
    leftTouch=true;
  }else if(clientX > width/2){
    rightTouch=true;
    leftTouch=false;
  }
});

canvas.addEventListener("touchend", (event) => {
  rightTouch = false;
  leftTouch = false;
});*/
}

function getImage(imageId){
    const image = Game.imageMap.get(imageId);
    if (!image){console.warn(`Image not found for sprite: ${imageId}`);}
    return image;
}

function loadObjects(){

    /*var layer0= new ParallexLayer("layer0",0.05,0.05);
    var layer1= new ParallexLayer("layer1",0.2,0.2);
    var layer2= new ParallexLayer("layer2",0.3,0.3);
    var layer3= new ParallexLayer("layer3",0.97,1);

    var porte01 = new Sprite('porte01',760,555);
    var porte02 = new Sprite('porte02',760+131,555);
    var left = new SpriteShow('left',2000,450,  200,450 + 64 + 3,0.08);
    var up = new SpriteShow('up',2000,450,   200 + 64 + 3 ,450,0.07);
    var down = new SpriteShow('down',2000,450,   200 + 64 + 3,450 + 64 + 3,0.06);
    var right = new SpriteShow('right',2000,450,  200 + 128 + 2*3,450 + 64 + 3 ,0.05);

    const b1 = new Banner(1510,400,'Live and Study in Paris');
    var arc = new SpriteShow('arc',1500,1000,  1500,690,0.1);
    var eiffle = new SpriteShow('eiffle',1700,1500,  1700,540,0.06);
    var notre_dame = new SpriteShow('notre_dame',1850,2500,  1850,640,0.05);


    const b2 = new Banner(2850,400,'Software Engineering student at Polytech-Saclay');
    var polytech = new SpriteShow('polytech',2600,700, 2600,410,0.015);


    const b3 = new Banner(3850,400,'guitar player');
    const guitar = new Sprite('player',3900,740);//::::::
    const music = new SpriteShowAnimation('music',4110,640,4110,640,1,100,100,10,4);


    var porte03 = new Sprite('porte01',4800,555);
    var porte04 = new Sprite('porte02',4800+131,555);



    var satellite = new SpriteShowAnimation('satellite',6000,0,6000,400,0.03,300,300,10,8);
    var paris_cite = new SpriteShow('paris_cite',7245,0,7245,400,0.03);
    var gameBoy = new SpriteShowAnimation('gameBoy',8500,0,8500,400,0.03, 183,300,10,4);

    var smabtp = new SpriteShow('smabtp',9850,100,9850,450,0.03);
    var polytechlogo = new SpriteShow('polytechlogo',11150,0,11150,450,0.03);*/

}
