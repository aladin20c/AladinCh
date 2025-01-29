/*Canvas*/
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext("2d");

const CANVAS_WIDTH = canvas.width = 1024;
const CANVAS_HEIGHT = canvas.height = 650;
const GROUND = 892;
const GRAVITY = 0.7;


/*Keyboard Controls*/
const keys = new Map();
window.addEventListener('keydown', (event) => {
  keys.set(event.key, true);
});
window.addEventListener('keyup', (event) => {
  keys.set(event.key, false);
});


/*Smarthphone touchScreen controls
if smn touches the left part of the screen than the player goes left and if the roght side is touched than the player goes right*/
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
});



/*player class*/
const IDLE = 0;
const RUNNING = 1;
const JUMPING = 2;
const FALLING = 3;
const MAX_RUNNING_VELOCITY = 10;
const MAX_JUMP_VELOCITY = -20;
const MAX_FALL_VELOCITY = 20;

class Player {


  constructor() {
    this.width=110;
    this.height=175;

    this.x=0;
    this.y=GROUND-this.height;

    this.velocityX=0;
    this.velocityY=0;

    this.onGround=false;
    this.facingRight=true;
    this.facingUp=false;
    this.facingDown=false;

  }


  /*draw(ctx,camera=null){
    ctx.fillStyle='#c9fffd';
    if(camera==null){
      ctx.fillRect(this.x,this.y, this.width, this.height);
    }else{
      ctx.fillRect (this.x - camera.x, this.y-camera.y , this.width, this.height);
    }
  }*/


  update(){
    if( (keys.get('ArrowRight') && !keys.get('ArrowLeft')) || (rightTouch && !leftTouch) ){

      this.facingRight=true;
      this.velocityX+=5;
      if(this.velocityX>MAX_RUNNING_VELOCITY) {this.velocityX=MAX_RUNNING_VELOCITY;}

    }else if(  (keys.get('ArrowLeft') && !keys.get('ArrowRight'))|| (!rightTouch && leftTouch) ){

      this.facingRight=false;
      this.velocityX-=5;
      if(this.velocityX < -MAX_RUNNING_VELOCITY) this.velocityX=-MAX_RUNNING_VELOCITY;

    }else{

      if(this.velocityX<0.2 && this.velocityX>-0.2) {
        this.velocityX=0;
      }
      else this.velocityX*=0.6;

    }

    this.x+=this.velocityX;

    //y_______________

    if(keys.get('ArrowUp') && !keys.get('ArrowDown')){

      this.facingUp=true;
      this.facingDown=false;
      if(this.onGround){
        this.velocityY-=20;
        this.onGround=false;
      }

    }else if( keys.get('ArrowDown') && !keys.get('ArrowUp')){

      this.facingUp=false;
      this.facingDown=true;
      this.velocityY+=1;

    }


    this.velocityY+=GRAVITY;
    if(this.velocityY > MAX_FALL_VELOCITY) {this.velocityY = MAX_FALL_VELOCITY;}
    else if(this.velocityY < MAX_JUMP_VELOCITY) {this.velocityY=MAX_JUMP_VELOCITY;}

    if(this.y+this.velocityY+this.height>GROUND){
      this.onGround=true;
      this.y=GROUND-this.height;
      this.velocityY=0;
    }else{
      this.onGround=false;
      this.y+=this.velocityY;
    }


    this.determineState();
  }

  determineState(){
    if(this.onGround){
      if(this.velocityX==0){
        this.state=IDLE;
      }else {
        this.state=RUNNING;
      }
    }else{
      if(this.velocityY>0){
        this.state = FALLING;
      }else{
        this.state = JUMPING;
      }

    }
  }



  draw(ctx,camera){
    this.frame = (this.frame + 1)%210000;
    var position = Math.floor(this.frame/this.staggerFrames) % this.animationStates[this.state];
    var frameX = this.spritewidth * position;
    var frameY = this.spriteHeight * this.state;
    /*if(this.facingRight){
      document.getElementById('character').classList.remove('flip');
    }else{
      document.getElementById('character').classList.add('flip');
    }*/
    ctx.drawImage(this.image, frameX, frameY, this.spritewidth, this.spriteHeight, this.x-camera.x, this.y-camera.y,this.spritewidth, this.spriteHeight);
  }



  initialiseAnimations(){
    this.state = IDLE;
    this.image=new Image();
    this.image.src='./sprite2.png'
    this.spritewidth = 110;
    this.spriteHeight = 175;
    this.frame = 0;
    this.staggerFrames=10;
    this.animationStates = [4,4,4,4];
  }

}
player = new Player();
player.initialiseAnimations();






/*Camera class*/
const LOOK_AHEAD_IDLE=200;
const LOOK_AHEAD_MOVING=200;
const LOOK_UP=30;
const LOOK_DOWN=50;
const LERP_SPEEDX=0.075;
const LERP_SPEEDJUMP=0;
const LERP_SPEEDFALL=0;

class Camera {

  constructor() {
    this.width=CANVAS_WIDTH;
    this.height=CANVAS_HEIGHT;
    this.x=(player.x+player.width/2) - this.width*0.5;
    this.y=(player.y+player.height/2) - this.height*0.5;
    if(this.x<0) this.x=0;
    if(this.y + this.height>1024) this.y=1024-this.height;
    if(this.y <0) this.y=0;

    this.speedX=0;
    this.speedY=0;

    this.centerX=0;
    this.centerY=0;
  }

  update(player){

    this.centerX=(player.x+player.width/2);
    this.centerY=(player.y+player.height/2);

    var destinationX=(player.x+player.width/2) - this.width*0.5;
    var destinationY=(player.y+player.height/2) - this.height*0.5;



    if(!player.onGround){

      if(player.velocityY>0){
        this.centerY+=LOOK_DOWN;
        destinationY+=LOOK_DOWN;
      }else{
        this.centerY-=LOOK_UP;
        destinationY-=LOOK_UP;
      }

    }else if(player.velocityX==0){  //fixme
      if(player.facingRight){
        this.centerX+=LOOK_AHEAD_IDLE;
        destinationX+=LOOK_AHEAD_IDLE;
      }else{
        this.centerX-=LOOK_AHEAD_IDLE;
        destinationX-=LOOK_AHEAD_IDLE;
      }
    }else{
      if(player.facingRight){
        this.centerX+=LOOK_AHEAD_MOVING;
        destinationX+=LOOK_AHEAD_MOVING;
      }else{
        this.centerX-=LOOK_AHEAD_MOVING;
        destinationX-=LOOK_AHEAD_MOVING;
      }
    }



    //the new camera position
    var lx= lerp(this.x,destinationX,LERP_SPEEDX);
    if(player.velocityY<0){
      var ly = lerp(this.y,destinationY,LERP_SPEEDJUMP);
    }else{
      var ly = lerp(this.y,destinationY,LERP_SPEEDFALL);
    }





    if(lx<0) {
      lx=0;
    }else if(lx+this.width > 15000){
      lx = 15000 - this.width;
    }

    if(ly + this.height>1024) ly=1024-this.height;
    //if(ly <0) ly=0;

    this.speedX = lx-this.x;
    this.speedY = ly - this.y;
    this.x= lx;
    this.y=ly;
  }

  draw(ctx,camera=null){
    ctx.fillStyle='green';
    ctx.fillRect(this.centerX-5 - this.x,this.centerY-5 - this.y,10,10);
  }

  vibrate(){
    this.x += Math.floor(Math.random()*15)-7;
    //this.y +=  (Math.floor(Math.random()*3)-1)/2;
  }

  contains(x,y,w,h){

  }

}
camera = new Camera();



player.y = 200;



/*Layers*/
var layer0= new ParallexLayer("layer0",0.05,0.05);
var layer1= new ParallexLayer("layer1",0.2,0.2);
var layer2= new ParallexLayer("layer2",0.3,0.3);
var layer3= new ParallexLayer("layer3",0.97,1);

/*introduction section*/
var porte01 = new Sprite('porte01',760,555);
var porte02 = new Sprite('porte02',760+131,555);
var left = new SpriteShow('left',2000,450,  200,450 + 64 + 3,0.08);
var up = new SpriteShow('up',2000,450,   200 + 64 + 3 ,450,0.07);
var down = new SpriteShow('down',2000,450,   200 + 64 + 3,450 + 64 + 3,0.06);
var right = new SpriteShow('right',2000,450,  200 + 128 + 2*3,450 + 64 + 3 ,0.05);

/*Paris section*/
const b1 = new Banner(1510,400,'Live and Study in Paris');
var arc = new SpriteShow('arc',1500,1000,  1500,690,0.1);
var eiffle = new SpriteShow('eiffle',1700,1500,  1700,540,0.06);
var notre_dame = new SpriteShow('notre_dame',1850,2500,  1850,640,0.05);

/*Polytech section*/
const b2 = new Banner(2850,400,'Software Engineering student at Polytech-Saclay');
var polytech = new SpriteShow('polytech',2600,700, 2600,410,0.015);

/*Guitar section*/
const b3 = new Banner(3850,400,'guitar player');
const guitar = new Sprite('player',3900,740);//::::::
const music = new SpriteShowAnimation('music',4110,640,4110,640,1,100,100,10,4);


var porte03 = new Sprite('porte01',4800,555);
var porte04 = new Sprite('porte02',4800+131,555);

/*Experience section*/

var satellite = new SpriteShowAnimation('satellite',6000,0,6000,400,0.03,300,300,10,8);
var paris_cite = new SpriteShow('paris_cite',7245,0,7245,400,0.03);
var gameBoy = new SpriteShowAnimation('gameBoy',8500,0,8500,400,0.03, 183,300,10,4);

var smabtp = new SpriteShow('smabtp',9850,0,9850,400,0.03);


/*plus function*/
var frames = 0;
var variable1 = false;
var variable2 = 0;

function worldUpdate(ctx){
  ++frames;
  frames = frames % 216000;


  layer0.update(camera);
  layer0.draw(ctx,camera);
  layer1.update(camera);
  layer1.draw(ctx,camera);
  layer2.update(camera);
  layer2.draw(ctx,camera);


  if(camera.x<1020){//first section
    //buttons
    if(!up.visible){
      up.activate();
      down.activate();
      right.activate();
      left.activate();
    }
    up.update();
    down.update();
    right.update();
    left.update();
    up.draw(ctx,camera);
    down.draw(ctx,camera);
    right.draw(ctx,camera);
    left.draw(ctx,camera);
    //text
    if(!(frames%30)) {variable1 = !variable1;}
    if(variable1){
      ctx.fillStyle  ='#292827';
      ctx.font='30px Times New Roman';
      ctx.fillText('press arrows to scroll through my resume',70-camera.x,620-camera.y);
    }
    ctx.font='20px Times New Roman';
    ctx.fillText('refresh the page the first time you log in',10-camera.x,400-camera.y);
    //first part of door
    porte01.draw(ctx,camera);

  }


  if(camera.x>500 && camera.x<2000){//second section
    if(player.x>1100 && !arc.visible){
      arc.activate();
      eiffle.activate();
      notre_dame.activate();
    }
    b1.draw(ctx,camera);
    arc.update();
    eiffle.update();
    notre_dame.update();
    arc.draw(ctx,camera);
    eiffle.draw(ctx,camera);
    notre_dame.draw(ctx,camera);
  }

  if(camera.x>1580 && camera.x<3400){//third section polytexh

    if(player.x >= 2200 && !polytech.visible){
      polytech.activate();
      variable2 = this.frames;
    }

    if(variable2 &&   Math.abs(this.frames - variable2)<151 ){
      camera.vibrate();
    }else{
      variable2=0;
    }

    b2.draw(ctx,camera);
    polytech.update();
    polytech.draw(ctx,camera);

  }

  if(camera.x>2830 && camera.x<4400){//4th section guitar
    b3.draw(ctx,camera);
    music.activate();
    music.update();
    music.draw(ctx,camera);
  }



  if(camera.x>4444 && camera.x<6300){//5th section guitar
    if(camera.x>5000 ){
      satellite.activate();
    }
    Banner.drawBanner(5500,400,'August 2022, Orléans','Seabex','Internship experience involved assisting in the analysis of','satellite imagery and contributing to web programming tasks.');
    satellite.update();
    gameBoy.update();
    satellite.draw(ctx,camera);
  }

  if(camera.x>5700 && camera.x<7600){
    if(camera.x>6300 && !paris_cite.visible){
      paris_cite.activate();
    }
    Banner.drawBanner(6750,400,'2022-2023, Paris','University Of Paris','As a student Counselor and Ambassador, provided guidance and','support to students during university open days, fairs and visits.');
    paris_cite.update();
    paris_cite.draw(ctx,camera);
  }

  if(camera.x>3750 && camera.x<5050){
    porte03.draw(ctx,camera);
  }

  if(camera.x>6950 && camera.x<8800){
    if(camera.x>7500 ){
      gameBoy.activate();
    }
    Banner.drawBanner(8000,400,'August 2023, Finland','University of Turku','Game Design & Game development summer school');
    gameBoy.update();
    gameBoy.draw(ctx,camera);
  }

  if(camera.x>8100 && camera.x<9000){
      Banner.drawBanner(9350,400,'Summer 2024, Paris','SMA BTP','Software developing internship involving Front End Programming','in Angular and Back End programming in Spring Boot');
      smabtp.update();
      smabtp.draw(ctx,camera);
  }

  if(camera.x>8800 && camera.x<11100){
        Banner.drawBanner(10700,400,'2024-2025, Orsay','Polytech Paris Saclay','Student tutor for first year student at polytech Paris Saclay','in Mathematics, Physics and computer science');
  }


  layer3.update(camera);
  layer3.draw(ctx,camera);

}


window.onload = function() {
    if(!window.location.hash) {
        window.location = window.location + '#loaded';
        window.location.reload();
    }
}


/************************************************/
function animate(){

  player.update();
  camera.update(player);

  worldUpdate(ctx);

  guitar.draw(ctx,camera);

  player.draw(ctx,camera);

  porte02.draw(ctx,camera);
  porte04.draw(ctx,camera);
  requestAnimationFrame (animate) ;
};
animate ();
