//--------------------------------------------------------------
//Global Variable
//--------------------------------------------------------------
var IMAGES_LOADED = false;
const  IMAGE_MAP = new Map();
const KEYS = new Map();
const    CANVAS_WIDTH = 1024;
const    CANVAS_HEIGHT = 650;
const    GRAVITY=0.7;

const ALL_OBJECTS = [];
var VISIBLE_OBJECTS = [];

function getImage(imageId){
    if(IMAGES_LOADED){
        const image = IMAGE_MAP.get(imageId);
        if (!image){console.warn(`Image not found for sprite: ${imageId}`);}
        return image;
    }
    console.warn(`Images not loaded yet`);
    return null;
}
function setUpControls(){
    window.addEventListener('keydown', (event) => {
        KEYS.set(event.key, true);
    });
    window.addEventListener('keyup', (event) => {
        KEYS.set(event.key, false);
    });
}
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
        IMAGES_LOADED = true;
        return;
    }

    images.forEach(img => {
        const id = img.id;
        IMAGE_MAP.set(id, img);

        if (img.complete && img.naturalWidth !== 0) {
            // Already loaded
            loadedCount++;
            if (loadedCount === totalImages) {
                IMAGES_LOADED = true;
            }
        } else {
            img.addEventListener('load', () => {
                loadedCount++;
                if (loadedCount === totalImages) {
                    IMAGES_LOADED = true;
                }
            });
            img.addEventListener('error', () => {
                console.warn(`Failed to load image with ID "${id}"`);
                loadedCount++;
                if (loadedCount === totalImages) {
                    IMAGES_LOADED = true;
                }
            });
        }
    });
}



//--------------------------------------------------------------
// Vector Class
//--------------------------------------------------------------

class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(value,y) {
        if (value instanceof Vector) {
            this.x += value.x;
            this.y += value.y;
        }else{
            this.x += value;
            this.y += y;
        }
        return this;
    }

    subtract(value,y) {
        if (value instanceof Vector) {
            this.x -= value.x;
            this.y -= value.y;
        }else{
            this.x -= value;
            this.y -= y;
        }
        return this;
    }

    multiply(value,y) {
        if (value instanceof Vector) {
            this.x *= value.x;
            this.y *= value.y;
        }else{
            this.x *= value;
            this.y *= y;
        }
        return this;
    }

    divide(value,y) {
        if (value instanceof Vector) {
            this.x /= value.x;
            this.y /= value.y;
        }else{
            this.x /= value;
            this.y /= y;
        }
        return this;
    }

    set(value,y) {
        if (value instanceof Vector) {
            this.x = value.x;
            this.y = value.y;
        }else{
            this.x = value;
            this.y = y;
        }
    }

    clone() {
        return new Vector(this.x, this.y);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    length2() {
        return this.x * this.x + this.y * this.y;
    }

    normalize() {
        const len = this.length();
        if (len > 0) {
            this.x /= len;
            this.y /= len;
        }
        return this;
    }

    dot(other) {
        return this.x * other.x + this.y * other.y;
    }

    cross(other) {
        return this.x * other.y - this.y * other.x;
    }

    distanceTo(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    distanceTo2(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return dx * dx + dy * dy;
    }

    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const newX = this.x * cos - this.y * sin;
        const newY = this.x * sin + this.y * cos;
        this.x = newX;
        this.y = newY;
        return this;
    }

    angle() {
        return Math.atan2(this.y, this.x);
    }

    angleTo(other) {
        return Math.atan2(this.cross(other), this.dot(other));
    }

    lerp(other, t) {
        this.x += (other.x - this.x) * t;
        this.y += (other.y - this.y) * t;
        return this;
    }

    toString() {
        return `Vector(${this.x}, ${this.y})`;
    }

    equals(other, epsilon = 0.001) {
        return (
            Math.abs(this.x - other.x) < epsilon &&
            Math.abs(this.y - other.y) < epsilon
        );
    }

    perpendicular() {
        return new Vector(-this.y, this.x);
    }
}


//--------------------------------------------------------------
//AABB class
//--------------------------------------------------------------
class AABB {
    constructor(position = new Vector(), width, height) {
        this.position = position;
        this.width = width;
        this.height = height;
    }

    setPosition(position){
        this.position.set(position);
    }

    translate(vec) {
        this.position.add(vec);
    }

    // Check if this AABB intersects with another AABB
    intersects(other) {
        return (
            this.position.x < other.position.x + other.width &&
            this.position.x + this.width > other.position.x &&
            this.position.y < other.position.y + other.height &&
            this.position.y + this.height > other.position.y
        );
    }

    // Check if this AABB completely contains another AABB
    contains(other) {
        return (
            this.position.x <= other.position.x &&
            this.position.x + this.width >= other.position.x + other.width &&
            this.position.y <= other.position.y &&
            this.position.y + this.height >= other.position.y + other.height
        );
    }

    // Get the minimum translation vector to resolve collision
    getCollisionResolution(other) {
        if (!this.intersects(other)) return new Vector(0, 0);

        // Calculate penetration depths on all sides
        const penLeft = (this.position.x + this.width) - other.position.x;
        const penRight = (other.position.x + other.width) - this.position.x;
        const penTop = (this.position.y + this.height) - other.position.y;
        const penBottom = (other.position.y + other.height) - this.position.y;

        // Find the minimum penetration
        const minX = Math.min(penLeft, penRight);
        const minY = Math.min(penTop, penBottom);
        const minPen = Math.min(minX, minY);

        // Create resolution vector
        const resolution = new Vector();
        
        if (minPen === penLeft) {
            resolution.x = -penLeft;
        } else if (minPen === penRight) {
            resolution.x = penRight;
        } else if (minPen === penTop) {
            resolution.y = -penTop;
        } else if (minPen === penBottom) {
            resolution.y = penBottom;
        }

        return resolution;
    }


    // Get the center point of the AABB
    getCenter() {
        return new Vector(
            this.position.x + this.width / 2,
            this.position.y + this.height / 2
        );
    }

    // Check if a point is inside the AABB
    containsPoint(point) {
        return (
            point.x >= this.position.x &&
            point.x <= this.position.x + this.width &&
            point.y >= this.position.y &&
            point.y <= this.position.y + this.height
        );
    }
}


//--------------------------------------------------------------
//Pea : Main component model
//--------------------------------------------------------------
class Pea {

    constructor() {
        this.children = [];
    }

    update() {
        for (const child of this.children) {
            child.update();
        }
    }

    draw(ctx, camera) {
        for (const child of this.children) {
            child.draw(ctx, camera);
        }
    }

    add(peas) {
        if (Array.isArray(peas)) {
            this.children.push(...peas);
        } else {
            this.children.push(peas);
        }
    }

    remove(peas) {
        if (!Array.isArray(peas)) peas = [peas];
        this.children = this.children.filter(child => !peas.includes(child));
    }

    clear() {
        this.children.length = 0;
    }

    intersectsWithCamera(camera) {
        return false;
    }
}




//--------------------------------------------------------------
//Sprites
//--------------------------------------------------------------
class Sprite extends Pea {
    constructor(imageId, position = new Vector(), zIndex) {
        super();
        this.image = getImage(imageId);
        this.zIndex = zIndex;
        this.position = position;
        this.shape = new AABB(this.position,this.image.width,this.image.height);
    }

    update() {}

    draw(ctx, camera = null){
        if (!this.image) return;
        const drawX = camera ? this.position.x - camera.shape.position.x : this.position.x;
        const drawY = camera ? this.position.y - camera.shape.position.y : this.position.y;
        ctx.drawImage(this.image, drawX, drawY, this.shape.width, this.shape.height);
    }


    intersectsWithCamera(camera) {
        camera.shape.intersects(this.shape);
    }
}


class ParallaxLayer extends Sprite {
    constructor(imageId, position, zIndex, speedModifierX = 1, speedModifierY = 1, repeatX = true, repeatY = true) {
        super(imageId, position, zIndex);
        this.speedModifierX = speedModifierX;
        this.speedModifierY = speedModifierY;
        this.repeatX = repeatX;
        this.repeatY = repeatY;
    }

    update() {}

    draw(ctx, camera = null) {
        if (!this.image || !camera) return;

        const camPos = camera.shape.position;

        const offsetX = camPos.x * this.speedModifierX;
        const offsetY = camPos.y * this.speedModifierY;

        // Anchor-based parallax position
        const baseX = this.position.x - offsetX;
        const baseY = this.position.y - offsetY;

        if (!this.repeatX && !this.repeatY) {
            // No tiling at all — draw single image
            ctx.drawImage(this.image, baseX, baseY, this.shape.width, this.shape.height);
            return;
        }

        // Compute tiling start aligned to anchor tile
        const startX = this.repeatX
            ? baseX % this.shape.width - this.shape.width
            : baseX;

        const startY = this.repeatY
            ? baseY % this.shape.height - this.shape.height
            : baseY;

        const endX = this.repeatX ? camera.shape.width + this.shape.width : baseX + 1;
        const endY = this.repeatY ? camera.shape.height + this.shape.height : baseY + 1;

        for (let y = startY; y < endY; y += this.shape.height) {
            for (let x = startX; x < endX; x += this.shape.width) {
                ctx.drawImage(this.image, x, y, this.shape.width, this.shape.height);
            }
        }
    }

    intersectsWithCamera(camera) {
        return true;
    }
}


class SpriteAnimation extends Sprite {
    constructor(imageId, position, zIndex, frameWidth, frameHeight, staggerFrames = 5) {
        super(imageId, position, zIndex);
        this.shape.width = frameWidth;
        this.shape.height = frameHeight;

        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.staggerFrames = staggerFrames;

        this.states = {}; // { stateName: { frames: number, row: number } }
        this.currentState = null;
        this.currentFrame = 0;
        this.frameCounter = 0;
    }

    addState(stateName, rowCount, frameCount) {
        this.states[stateName] = {
            row: rowCount,
            frames: frameCount
        };
        if (!this.currentState) this.setState(stateName); // Default to first added
    }

    setState(stateName) {
        if (this.states[stateName]) {
            if (this.currentState !== stateName) {
                this.currentState = stateName;
                this.currentFrame = 0;
                this.frameCounter = 0;
            }
        } else {
            console.warn(`State "${stateName}" does not exist.`);
        }
    }

    update() {
        if (!this.currentState || !this.image) return;

        this.frameCounter++;
        if (this.frameCounter >= this.staggerFrames) {
            this.currentFrame = (this.currentFrame + 1) % this.states[this.currentState].frames;
            this.frameCounter = 0;
        }
    }

    draw(ctx, camera = null) {
        if (!this.image || !this.currentState) return;

        const state = this.states[this.currentState];
        const sx = this.currentFrame * this.frameWidth;
        const sy = state.row * this.frameHeight;

        const drawX = camera ? this.position.x - camera.shape.position.x : this.position.x;
        const drawY = camera ? this.position.y - camera.shape.position.y : this.position.y;

        ctx.drawImage(
            this.image,
            sx, sy,
            this.frameWidth, this.frameHeight,
            drawX, drawY,
            this.frameWidth, this.frameHeight
        );
    }

    intersectsWithCamera(camera) {
        camera.shape.intersects(this.shape);
    }
}



//--------------------------------------------------------------
//Player class
//--------------------------------------------------------------
class Player {
    constructor() {
        this.shape = new AABB(new Vector(10, 400), 110, 175);
        this.cameraTarget = this.shape.getCenter();
        this.zIndex = 10;
        this.velocity = new Vector(0, 0);

        //sprite
        this.sprite = new SpriteAnimation("sprite", this.shape.position, this.zIndex, 110, 175, 8);
        this.sprite.addState("idle", 0, 4);
        this.sprite.addState("running", 1, 4);
        this.sprite.addState("jumping", 2, 4);
        this.sprite.addState("falling", 3, 4);
        this.sprite.setState("idle");

        //other
        this.facingRight = true;
        this.maxRunningVelocity = 10;

        this.onGround = false;
        this.maxFallVelocity = 20;

        //jump
        this.jumpTimer = 0;
        this.isJumping = false;
        this.maxJumpTime = 20; // frames or ticks
        this.jumpSpeed = -10; // initial jump impulse per frame
    }

    draw(ctx, camera = null) {
        if (!this.sprite) {
            ctx.fillStyle = '#c9fffd';
            const drawX = camera ? this.shape.position.x - camera.position.x : this.shape.position.x;
            const drawY = camera ? this.shape.position.y - camera.position.y : this.shape.position.y;
            ctx.fillRect(drawX, drawY, this.shape.width, this.shape.height);
        } else {
            this.sprite.update();
            this.sprite.draw(ctx, camera);
        }
    }

    translate(vector){
        this.shape.translate(vector);
        this.cameraTarget.add(vector);
    }


    update(objectSet) {
        const keysPressed = {
            left: KEYS.get('ArrowLeft'),
            right: KEYS.get('ArrowRight'),
            jump: KEYS.get('ArrowUp'),
        };

        // ----------------
        // Horizontal movement
        // ----------------
        if (keysPressed.right && !keysPressed.left) {
            this.facingRight = true;
            this.velocity.x += 1;
            if (this.velocity.x > this.maxRunningVelocity) this.velocity.x = this.maxRunningVelocity;
        } else if (keysPressed.left && !keysPressed.right) {
            this.facingRight = false;
            this.velocity.x -= 1;
            if (this.velocity.x < -this.maxRunningVelocity) this.velocity.x = -this.maxRunningVelocity;
        } else {
            this.velocity.x *= 0.5;
            if (Math.abs(this.velocity.x) < 0.2) this.velocity.x = 0;
        }

        // ----------------
        // Variable Jumping
        // ----------------
        if (keysPressed.jump) {
            if (this.onGround) {
                // Start jump
                this.isJumping = true;
                this.jumpTimer = 0;
                this.onGround = false;
            }

            if (this.isJumping && this.jumpTimer < this.maxJumpTime) {
                this.velocity.y = this.jumpSpeed;
                this.jumpTimer++;
            }
        } else {
            // Jump key released early
            this.isJumping = false;
        }

        // ----------------
        // Gravity
        // ----------------
        this.velocity.y += GRAVITY;
        if (this.velocity.y > this.maxFallVelocity) this.velocity.y = this.maxFallVelocity;

        // ----------------
        // Apply Velocity
        // ----------------
        this.translate(this.velocity);

        // ----------------
        // Collision Resolution + Ground Check
        // ----------------
        this.onGround = false;


        for (const object of VISIBLE_OBJECTS) {
            if (object.zIndex === this.zIndex) {
                const resolution = this.shape.getCollisionResolution(object.shape);
                if (resolution) {
                    this.translate(resolution);

                    // Ground detection
                    if (resolution.y < 0) {
                        this.onGround = true;
                        this.velocity.y = 0;
                        this.isJumping = false;
                    }

                    // Optional: stop horizontal velocity on side collisions
                    if (resolution.x !== 0) {
                        this.velocity.x = 0;
                    }
                }
            }
        }


        this.determineState();
    }

    intersectsWithCamera(camera) {
        return true;
    }



    determineState() {
        if (!this.sprite) return;

        if (!this.onGround) {
            if (this.velocity.y < 0) {
                this.sprite.setState("jumping");
            } else {
                this.sprite.setState("falling");
            }
        } else if (Math.abs(this.velocity.x) > 0.4) {
            this.sprite.setState("running");
        } else {
            this.sprite.setState("idle");
        }
    }




}


//--------------------------------------------------------------
//Camera
//--------------------------------------------------------------
class Camera {
    constructor() {
        this.shape = new AABB(new Vector(0,0),CANVAS_WIDTH, CANVAS_HEIGHT);
        this.target = new Vector();
        this.followSpeedX = 0.1; // 0 = no follow, 1 = instant snap
        this.followSpeedY = 0.1; // 0 = no follow, 1 = instant snap
        this.easingFunctionX = (t) => t; // Default: linear easing
        this.easingFunctionY = (t) => t; // Default: linear easing
        this.followX = true;
        this.followY = true;
        this.bounds = {minX:-10000,minY:-10000,maxX:10000,maxY:10000};
    }


    //(t => t); // Linear
    //(t => t * t); // Ease-in (slow start)
    //(t => 1 - Math.pow(1 - t, 2)); // Ease-out
    setTarget(target){this.target = target;}
    setEasingFunctionX(fn) {this.easingFunctionX = fn;}
    setEasingFunctionY(fn) {this.easingFunctionY = fn;}
    setFollowSpeedX(speed) {this.followSpeedX = Math.max(0, Math.min(1, speed));}
    setFollowSpeedY(speed) {this.followSpeedY = Math.max(0, Math.min(1, speed));}
    setBounds(bounds) {this.bounds = bounds;}


    intersectsObject(object) {
        if (object.shape) return this.shape.intersects(object.shape);
        return false;
    }

    update() {
        if (this.target) {
            const targetX = this.target.x - this.shape.width / 2;
            const targetY = this.target.y - this.shape.height / 2;
            const easeX = this.easingFunctionX(this.followSpeedX);
            const easeY = this.easingFunctionY(this.followSpeedY);
            if (this.followX) {
                this.shape.position.x += (targetX - this.shape.position.x) * easeX;
            }
            if (this.followY) {
                this.shape.position.y += (targetY - this.shape.position.y) * easeY;
            }

            if (this.bounds) {
                this.shape.position.set(
                    Math.max(this.bounds.minX, Math.min(this.bounds.maxX - this.shape.width, this.shape.position.x)),
                    Math.max(this.bounds.minY, Math.min(this.bounds.maxY - this.shape.height, this.shape.position.y))
                );
            }
        }
    }
}



//--------------------------------------------------------------
//obj class
//--------------------------------------------------------------


class StaticObject extends Pea{
    constructor(shape, zIndex) {
        super();
        this.shape = shape;
        this.zIndex = zIndex;
    }

    intersectsWithCamera(camera) {
        return camera.shape.intersects(this.shape);
    }
}


class MovingObject extends StaticObject{
    constructor(startPosition, endPosition, shape, zIndex , oscillate = false) {
        super(shape,zIndex);
        this.startPosition = startPosition;
        this.endPosition = endPosition;
        this.shape.position.set(this.startPosition);

        this.oscillate = oscillate;
        this.easingFunction = (t) => t;
        this.duration = 1.5;
        this.time = 0;
        this.forward = true;
    }

    setEasing(fn) {
        this.easingFunction = fn;
    }

    update() {
        const delta = 1 / 60; // assuming 60 FPS
        this.time += delta;

        let t = this.time / this.duration;

        if (t >= 1) {
            if (this.oscillate) {
                this.forward = !this.forward;
                this.time = 0;
                t = 0;
            } else {
                t = 1;
            }
        }

        const ease = this.easingFunction(t);

        const from = this.forward ? this.startPosition : this.endPosition;
        const to = this.forward ? this.endPosition : this.startPosition;

        this.shape.position.set(from.x + (to.x - from.x) * ease, from.y + (to.y - from.y) * ease);
        super.update();
    }

}































//-----------------------------------------------------------------------



loadImages();
setUpControls();
const PLAYER = new Player();
const CAMERA = new Camera();
CAMERA.setTarget(PLAYER.cameraTarget);


function buildWorld(){
    const layer0 = new ParallaxLayer("layer0",new Vector(0,-200),0,0.1,0.1,true,false);
    const layer1 = new ParallaxLayer("layer1",new Vector(0,390),1,0.2,0.2,true,false);
    const layer2 = new ParallaxLayer("layer2",new Vector(0,510),2,0.3,0.3,true,false);
    const tile1 = new StaticObject(new AABB(new Vector(0, 1000),512,128) ,PLAYER.zIndex);
    tile1.add(
        new Sprite("tile1",tile1.shape.position,PLAYER.zIndex-1)
    );

    ALL_OBJECTS.push(layer0);
    ALL_OBJECTS.push(layer1);
    ALL_OBJECTS.push(layer2);

    ALL_OBJECTS.push(tile1);
    /*
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



function gameLoop() {
    VISIBLE_OBJECTS = [];

    for (const obj of ALL_OBJECTS) {
        if (obj.intersectsWithCamera(CAMERA)) {
            VISIBLE_OBJECTS.push(obj);
        }
    }

    // Sort by zIndex ascending (lower zIndex = drawn first)
    VISIBLE_OBJECTS.sort((a, b) => a.zIndex - b.zIndex);

    // --- UPDATE ---
    for (const obj of VISIBLE_OBJECTS) {
        obj.update();
    }
    PLAYER.update();
    CAMERA.update();

    // --- RENDER ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const obj of VISIBLE_OBJECTS) {
        if (obj.zIndex <= PLAYER.zIndex) obj.draw(ctx, CAMERA);
    }
    PLAYER.draw(ctx, CAMERA);
    for (const obj of VISIBLE_OBJECTS) {
        if (obj.zIndex > PLAYER.zIndex) obj.draw(ctx, CAMERA);
    }

}

buildWorld();
//--------------------------------------------------------------------------




class Banner{
    constructor(x,y,text){
        this.x=x;
        this.y=y;
        this.text=text;
        this.font='25px Times New Roman';
        this.color = 'white';
        this.offX = 0;

        ctx.font = this.font;
        var m=ctx.measureText(this.text).width;

        if(m<(ad.width-20)){
            this.offX = (ad.width - m)* 0.5;
        }else{
            this.font='20px Times New Roman';
            ctx.font = this.font;
            m=ctx.measureText(this.text).width;
            this.offX = (ad.width - m)* 0.5;
        }

    }

    update(camera=null){}

    draw(ctx,camera){
        ctx.drawImage(ad,this.x-camera.x, this.y-camera.y);
        ctx.fillStyle = this.color;
        ctx.font = this.font;
        ctx.fillText(this.text, this.x + this.offX - camera.x, this.y+25-camera.y);
    }

    static drawBanner(x,y,text1,text2,text3,text4 = null){
        ctx.fillStyle = '#777777';
        ctx.fillRect(x-camera.x-7,y-camera.y-7,526,270);
        ctx.fillStyle = '#444444';
        ctx.fillRect(x-camera.x,y-camera.y,512,256);

        ctx.fillStyle = 'white';
        ctx.font='bold 35px Georgia';
        ctx.fillText(text1,x-camera.x+20, y-camera.y+60);
        ctx.font='bold 30px Trebuchet MS';
        ctx.fillText(text2,x-camera.x+20, y-camera.y+120);
        ctx.font='17px Times New Roman';
        ctx.fillText(text3,x-camera.x+20, y-camera.y+170);
        if(text4!=null){
            ctx.fillText(text4,x-camera.x+20, y-camera.y+200);
        }

    }


}
