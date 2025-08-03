//--------------------------------------------------------------
//Global Variable
//--------------------------------------------------------------
let IMAGES_LOADED = false;
const IMAGE_MAP = new Map();
const KEYS = new Map();
const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 650;
const GRAVITY=0.7;

const DRAW_OBJECTS = [];
const UPDATE_OBJECTS = [];
const COLLISION_OBJECTS = [];

let PLAYER = null;
let CAMERA = null;
const PLAYER_INDEX = 10;

function getImage(imageId){
    if(IMAGES_LOADED){
        const image = IMAGE_MAP.get(imageId);
        if (!image){console.warn(`Image not found for sprite: ${imageId}`);}
        return image;
    }
    console.warn(`Images not loaded yet`);
    return null;
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

    manhattanDistance(other) {
        return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
    }
}


//--------------------------------------------------------------
//AABB class
//--------------------------------------------------------------
class AABB {
    constructor(a, b, c, d) {
        if (a instanceof Vector) {
            // Form: new AABB(position, width, height)
            this.position = a;
            this.width = b;
            this.height = c;
        } else {
            // Form: new AABB(x, y, width, height)
            this.position = new Vector(a, b);
            this.width = c;
            this.height = d;
        }
    }

    translate(vec) {
        this.position.add(vec);
    }

    intersects(other) {
        return (
            this.position.x < other.position.x + other.width &&
            this.position.x + this.width > other.position.x &&
            this.position.y < other.position.y + other.height &&
            this.position.y + this.height > other.position.y
        );
    }

    intersectsRaw(x, y, w, h) {
        return (
            this.position.x < x + w &&
            this.position.x + this.width > x &&
            this.position.y < y + h &&
            this.position.y + this.height > y
        );
    }

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

    constructor(position = new Vector(),zIndexDraw,zIndexCollision) {
        this.position = position;
        this.zIndexDraw = zIndexDraw;
        this.zIndexCollision = zIndexCollision;
        this.children = null;
    }

    update() {
        if (this.children) {
            for (const child of this.children) {
                child.update();
            }
        }
    }

    draw(ctx, camera) {
        if (this.children) {
            for (const child of this.children) {
                child.draw(ctx, camera);
            }
        }
    }

    add(peas) {
        if (this.children===null) this.children = [];
        if (Array.isArray(peas)) {
            this.children.push(...peas);
        } else {
            this.children.push(peas);
        }
    }

    remove(peas) {
        if (this.children) {
            if (!Array.isArray(peas)) peas = [peas];
            this.children = this.children.filter(child => !peas.includes(child));
        }
    }

    clear() {
        if (this.children) {
            this.children.length = 0;
        }
    }

    intersectsWithCamera(camera) {
        return camera.shape.containsPoint(this.position);
    }
}


//--------------------------------------------------------------
//Sprites
//--------------------------------------------------------------
class Sprite extends Pea {
    constructor(imageId, position = new Vector(), zIndexDraw,zIndexCollision) {
        super(position,zIndexDraw,zIndexCollision);
        this.image = getImage(imageId);
        this.position = position;
        this.width = this.image.width;
        this.height = this.image.height;
    }

    update() {}

    draw(ctx, camera){
        if (!this.image || !camera.shape.intersectsRaw(this.position.x,this.position.y,this.width,this.height)) return;
        ctx.drawImage(
            this.image,
            this.position.x - camera.position.x,
            this.position.y - camera.position.y ,
            this.width,
            this.height
        );
    }

    intersectsWithCamera(camera) {
        return camera.shape.intersectsRaw(this.position.x,this.position.y,this.width,this.height);
    }
}


class ParallaxLayer extends Sprite {
    constructor(imageId, position, zIndexDraw,zIndexCollision, speedModifierX = 1, speedModifierY = 1, repeatX = true, repeatY = true) {
        super(imageId, position, zIndexDraw,zIndexCollision);
        this.speedModifierX = speedModifierX;
        this.speedModifierY = speedModifierY;
        this.repeatX = repeatX;
        this.repeatY = repeatY;
    }

    update() {}

    draw(ctx, camera ) {
        if (!this.image || !camera) return;

        const offsetX = camera.position.x * this.speedModifierX;
        const offsetY = camera.position.y * this.speedModifierY;

        // Anchor-based parallax position
        const baseX = this.position.x - offsetX;
        const baseY = this.position.y - offsetY;

        if (!this.repeatX && !this.repeatY) {
            // No tiling at all — draw single image
            ctx.drawImage(this.image, baseX, baseY, this.width, this.height);
            return;
        }

        // Compute tiling start aligned to anchor tile
        const startX = this.repeatX
            ? baseX % this.width - this.width
            : baseX;

        const startY = this.repeatY
            ? baseY % this.height - this.height
            : baseY;

        const endX = this.repeatX ? camera.shape.width + this.width : baseX + 1;
        const endY = this.repeatY ? camera.shape.height + this.height : baseY + 1;

        for (let y = startY; y < endY; y += this.height) {
            for (let x = startX; x < endX; x += this.width) {
                ctx.drawImage(this.image, x, y, this.width, this.height);
            }
        }
    }

    intersectsWithCamera(camera) {
        return true;
    }
}


class SpriteAnimation extends Sprite {
    constructor(imageId, position, zIndexDraw,zIndexCollision, frameWidth, frameHeight, staggerFrames = 5) {
        super(imageId, position, zIndexDraw,zIndexCollision);

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

    draw(ctx, camera ) {
        if (!this.image || !this.currentState || !camera.shape.intersectsRaw(this.position.x,this.position.y,this.frameWidth,this.frameHeight)) return;

        const state = this.states[this.currentState];

        ctx.drawImage(
            this.image,
            this.currentFrame * this.frameWidth, //sx
            state.row * this.frameHeight, //sy
            this.frameWidth, this.frameHeight,
            this.position.x - camera.position.x,  //drawX
            this.position.y - camera.position.y, //drawY
            this.frameWidth, this.frameHeight
        );
    }

    intersectsWithCamera(camera) {
        camera.shape.intersectsRaw(this.position.x,this.position.y,this.frameWidth,this.frameHeight);
    }
}



//--------------------------------------------------------------
//Player class
//--------------------------------------------------------------
class Player {
    constructor() {
        this.position = new Vector(10, 400);
        this.shape = new AABB(this.position.clone().add(30,15), 65, 160);
        this.cameraTarget = this.shape.getCenter();
        this.zIndexDraw = PLAYER_INDEX;
        this.zIndexCollision = PLAYER_INDEX;
        this.velocity = new Vector(0, 0);

        //sprite
        this.sprite = new SpriteAnimation("sprite", this.position, this.zIndexDraw,this.zIndexDraw, 110, 175, 4);
        this.sprite.addState("idle", 0, 4);
        this.sprite.addState("running", 1, 4);
        this.sprite.addState("jumping", 2, 4);
        this.sprite.addState("falling", 3, 4);
        this.sprite.setState("idle");

        //other
        this.facingRight = true;
        this.maxRunningVelocity = 15;

        this.onGround = false;
        this.maxFallVelocity = 30;

        //jump
        this.jumpTimer = 0;
        this.isJumping = false;
        this.maxJumpTime = 20; // frames or ticks
        this.jumpSpeed = -10; // initial jump impulse per frame
    }

    draw(ctx, camera ) {
        this.sprite.update();
        this.sprite.draw(ctx, camera);
        //ctx.fillRect(this.shape.position.x-camera.position.x,this.shape.position.y-camera.position.y,this.shape.width,this.shape.height);
    }

    translate(vector){
        this.position.add(vector);
        this.shape.translate(vector);
        this.cameraTarget.add(vector);
    }


    update() {
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
            this.velocity.x *= 0.4;
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


        for (const object of COLLISION_OBJECTS) {
            if (object.zIndexCollision === this.zIndexCollision) {
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
        this.position = new Vector(0,0);
        this.shape = new AABB(this.position,CANVAS_WIDTH, CANVAS_HEIGHT);

        this.target = null;
        this.followSpeedX = 0.1; // 0 = no follow, 1 = instant snap
        this.followSpeedY = 0.1; // 0 = no follow, 1 = instant snap
        this.easingFunctionX = (t) => t; // Default: linear easing
        this.easingFunctionY = (t) => t; // Default: linear easing
        this.followX = true;
        this.followY = true;
        this.bounds = null; //{minX:-10000,minY:-10000,maxX:10000,maxY:10000};
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



    update() {
        if (!this.target) return;
        const targetX = this.target.x - this.shape.width / 2;
        const targetY = this.target.y - this.shape.height / 2;
        const easeX = this.easingFunctionX(this.followSpeedX);
        const easeY = this.easingFunctionY(this.followSpeedY);

        if (this.followX) {
            this.position.x += (targetX - this.position.x) * easeX;
        }
        if (this.followY) {
            this.position.y += (targetY - this.position.y) * easeY;
        }

            if (this.bounds) {
                this.position.set(
                    Math.max(this.bounds.minX, Math.min(this.bounds.maxX - this.shape.width, this.shape.position.x)),
                    Math.max(this.bounds.minY, Math.min(this.bounds.maxY - this.shape.height, this.shape.position.y))
                );
            }
    }


}



//--------------------------------------------------------------
//obj class
//--------------------------------------------------------------


class StaticObject extends Pea{
    constructor(position, zIndexDraw,zIndexCollision,shape = null) {
        super(position, zIndexDraw,zIndexCollision);
        this.shape = shape;
    }

    setShape(shape){this.shape=shape;}

    intersectsWithCamera(camera) {
        if (this.shape){
            return this.shape.intersects(camera.shape);
        }
        return false;
    }
}

class MovingObject extends StaticObject{
    constructor(startPosition, endPosition, zIndexDraw,zIndexCollision , shape, oscillate = false) {
        super(startPosition.clone(),zIndexDraw,zIndexCollision,shape);
        this.startPosition = startPosition;
        this.endPosition = endPosition;

        this.oscillate = oscillate;
        this.easingFunction = (t) => t;
        this.duration = 1.5;
        this.time = 0;
        this.forward = true;
    }

    setEasing(fn) {
        this.easingFunction = fn;
    }

    setDuration(duration){
        this.duration = duration;
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

        this.position.set(from.x + (to.x - from.x) * ease, from.y + (to.y - from.y) * ease);
        super.update();
    }

}




//-----------------------------------------------------------------------
//-----------------------------------------------------------------------
//-----------------------------------------------------------------------
//-----------------------------------------------------------------------
//-----------------------------------------------------------------------
//-----------------------------------------------------------------------
//-----------------------------------------------------------------------
//-----------------------------------------------------------------------
//-----------------------------------------------------------------------
//-----------------------------------------------------------------------
function removeLoadingScreen() {
    const screen = document.getElementById('loading-screen');
    if (screen) {
        screen.style.opacity = '0';
        setTimeout(() => screen.remove(), 400);
    }
}

function setUpControls(){
    console.log('setting up controls ...');
    window.addEventListener('keydown', (event) => {
        KEYS.set(event.key, true);
    });
    window.addEventListener('keyup', (event) => {
        KEYS.set(event.key, false);
    });
}

function loadImages() {
    console.log('loading images ...');
    return new Promise((resolve) => {
        const container = document.getElementById('images');
        if (!container) {
            console.warn(`Container with ID "images" not found.`);
            resolve(); // Resolve anyway, so buildWorld can continue
            return;
        }

        const images = container.querySelectorAll('img[id]');
        const totalImages = images.length;
        if (totalImages === 0) {
            IMAGES_LOADED = true;
            resolve();
            return;
        }

        let loadedCount = 0;

        const checkAllLoaded = () => {
            loadedCount++;
            if (loadedCount === totalImages) {
                IMAGES_LOADED = true;
                resolve();
            }
        };

        images.forEach(img => {
            const id = img.id;
            IMAGE_MAP.set(id, img);

            if (img.complete && img.naturalWidth !== 0) {
                // Already loaded
                checkAllLoaded();
            } else {
                img.addEventListener('load', checkAllLoaded);
                img.addEventListener('error', () => {
                    console.warn(`Failed to load image with ID "${id}"`);
                    checkAllLoaded();
                });
            }
        });
    });
}

function buildArrows(){

    const delta = 80;

    const arrows = ['left','down','right','up'];
    const endPos = [new Vector(200 ,900),new Vector(200 + delta,900 ),new Vector(200 + 2 * delta,900 ),new Vector(200 + delta,900 - delta)];
    const startPos = [new Vector(2000 ,600),new Vector(3000 + delta,900 ),new Vector(4000,700 ),new Vector(3000 ,400)];
    const duration =[2,2.5,3,2];
    for (let i = 0; i < arrows.length;i++){
        const ar = new MovingObject(
            startPos[i],
            endPos[i],
            PLAYER_INDEX,PLAYER_INDEX, null, false);
        ar.setShape(new AABB(ar.position,64,64));
        const arSprite = new Sprite(arrows[i],ar.position,PLAYER_INDEX+1,PLAYER_INDEX+1);
        ar.add(arSprite);

        //t => (1 - Math.exp(-10 * t)) / (1 - Math.exp(-10))
        ar.setEasing((t => 1 - Math.exp(-6 * t)));
        ar.setDuration(duration[i]);

        DRAW_OBJECTS.push(arSprite);
        UPDATE_OBJECTS.push(ar);
        COLLISION_OBJECTS.push(ar);
    }
}


function buildWorld(){
    console.log('building world ...');

    PLAYER = new Player();
    CAMERA = new Camera();
    CAMERA.setTarget(PLAYER.cameraTarget);
    CAMERA.setBounds({minX:-100,minY:410,maxX:50000,maxY:1130});

    const layer0 = new ParallaxLayer("layer0",new Vector(0,-200),0,0,0.1,0.1,true,false);
    const layer1 = new ParallaxLayer("layer1",new Vector(0,390),1,1,0.2,0.2,true,false);
    const layer2 = new ParallaxLayer("layer2",new Vector(0,510),2,2,0.3,0.3,true,false);
    const layer3 = new ParallaxLayer("layer3",new Vector(0,1000),3,3,1,1,true,false);
    DRAW_OBJECTS.push(layer0);
    DRAW_OBJECTS.push(layer1);
    DRAW_OBJECTS.push(layer2);
    DRAW_OBJECTS.push(layer3);



    const ground = new StaticObject(new Vector(-1000,1000),PLAYER_INDEX+1,PLAYER_INDEX,null);
    ground.setShape(new AABB(ground.position,50000,500));
    COLLISION_OBJECTS.push(ground);
    buildArrows();


    const porte = new StaticObject(new Vector(700,664),PLAYER_INDEX,PLAYER_INDEX,null);
    porte.setShape(new AABB(porte.position.clone().add(107,35)  ,47,90));
    const portSprite1 = new Sprite('porte01',porte.position,PLAYER_INDEX-1,PLAYER_INDEX-1);
    const portSprite2 = new Sprite('porte02',porte.position.clone().add(130,0),PLAYER_INDEX+1,PLAYER_INDEX+1);
    porte.add(portSprite1);
    porte.add(portSprite2);


    COLLISION_OBJECTS.push(porte);
    DRAW_OBJECTS.push(portSprite1);
    DRAW_OBJECTS.push(portSprite2);


    /*
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
    var gameB = new SpriteShowAnimation('gameB',8500,0,8500,400,0.03, 183,300,10,4);

    var smabtp = new SpriteShow('smabtp',9850,100,9850,450,0.03);
    var polytechlogo = new SpriteShow('polytechlogo',11150,0,11150,450,0.03);*/



    // Sort by zIndex ascending (lower zIndex = drawn first)
    DRAW_OBJECTS.sort((a, b) => a.zIndexDraw - b.zIndexDraw);
    COLLISION_OBJECTS.sort((a, b) => a.zIndexCollision - b.zIndexCollision);
    UPDATE_OBJECTS.sort((a, b) => a.zIndexCollision - b.zIndexCollision);

}



function gameLoop() {
    // --- UPDATE ---
    for (const obj of UPDATE_OBJECTS) {
        obj.update();
    }
    PLAYER.update();
    CAMERA.update();

    // --- RENDER ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const obj of DRAW_OBJECTS) {
        if (obj.zIndexDraw <= PLAYER.zIndexDraw) obj.draw(ctx, CAMERA);
    }
    PLAYER.draw(ctx, CAMERA);
    for (const obj of DRAW_OBJECTS) {
        if (obj.zIndexDraw > PLAYER.zIndexDraw) obj.draw(ctx, CAMERA);
    }

}


































/*
class Banner{
    constructor(x,y,text){
        this.x=x;
        this.y=y;
        this.text=text;
        this.font='25px Times New Roman';
        this.color = 'white';
        this.offX = 0;

        ctx.font = this.font;
        let m=ctx.measureText(this.text).width;

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
*/