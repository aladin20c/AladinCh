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


class Banner extends Pea{
    constructor( position = new Vector(), zIndexDraw,zIndexCollision,
                 {
                     text = 'Banner',
                     font = 'Times New Roman',
                     fontSize = 20,
                     textColor = '#FFFFFF',
                     backgroundColor = '#DC2521',
                     offX = 100,
                     offY = 5,
                     staggerFrames = 0
                 } = {}) {

        super(position,zIndexDraw,zIndexCollision);
        this.text = text;
        this.font = font;
        this.fontSize = fontSize;
        this.textColor = textColor;
        this.backgroundColor = backgroundColor;
        this.offX = offX;
        this.offY = offY;

        this.width = 0;
        this.height = 0;
        this.updateWidthHeight();

        this.staggerFrames = staggerFrames;
        this.frameCounter = 0;
        this.visible = true;
    }

    updateWidthHeight() {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.font = `${this.fontSize}px ${this.font}`;

        this.width = tempCtx.measureText(this.text).width + this.offX * 2;
        this.height = this.fontSize + this.offY * 2;
    }


    update() {
        if (this.staggerFrames > 0) {
            this.frameCounter++;
            if (this.frameCounter >= this.staggerFrames) {
                this.visible = !this.visible;
                this.frameCounter = 0;
            }
        }
    }

    draw(ctx, camera) {
        if (!this.visible || !camera.shape.intersectsRaw(this.position.x,this.position.y,this.width,this.height)) return;

        ctx.save();

        if (this.backgroundColor) {
            ctx.fillStyle = this.backgroundColor;
            ctx.fillRect(this.position.x - camera.position.x, this.position.y - camera.position.y, this.width, this.height);
        }

        ctx.fillStyle = this.textColor;
        ctx.font = `${this.fontSize}px ${this.font}`;
        ctx.textBaseline = 'top';
        ctx.fillText(this.text, this.position.x + this.offX - camera.position.x, this.position.y + this.offY - camera.position.y);

        ctx.restore();
    }
}
//--------------------------------------------------------------
//Player class
//--------------------------------------------------------------
class Player {
    constructor() {
        this.position = new Vector(10, 400);
        this.shape = new AABB(this.position.clone().add(30,15), 65, 160);
        this.cameraTarget = this.shape.getCenter().add(100,0);
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

    shake(){
        this.position.add( Math.floor(Math.random()*15)-7,0);
        //this.y +=  (Math.floor(Math.random()*3)-1)/2;
    }

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
    constructor(startPosition, endPosition, zIndexDraw,zIndexCollision , shape = null, oscillate = false) {
        super(startPosition.clone(),zIndexDraw,zIndexCollision,shape);
        this.startPosition = startPosition;
        this.endPosition = endPosition;

        this.oscillate = oscillate;
        this.easingFunction = (t) => t;
        this.duration = 1.5;
        this.time = 0;
        this.forward = true;

        this.active = false;
    }

    setActive(active){
        this.active = active;
    }

    setEasing(fn) {
        this.easingFunction = fn;
    }

    setDuration(duration){
        this.duration = duration;
    }

    shouldActivate() {
        // Default condition: always activate
        return true;
    }

    isDone(){
        return !this.oscillate && this.time >= this.duration;
    }

    update() {

        if (!this.active) {
            if (this.isDone()) return;
            if (this.shouldActivate()) {
                this.setActive(true);
            } else {
                return;
            }
        }


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
                this.setActive(false);
            }
        }

        const ease = this.easingFunction(t);

        const from = this.forward ? this.startPosition : this.endPosition;
        const to = this.forward ? this.endPosition : this.startPosition;

        this.position.set(from.x + (to.x - from.x) * ease, from.y + (to.y - from.y) * ease);
        super.update();
    }

}

class TriggerZone extends StaticObject{
    constructor(position, zIndexDraw,zIndexCollision,shape) {
        super(position, zIndexDraw,zIndexCollision,shape);
    }

    trigger(){
        //if (this.shape) return this.shape.intersects(player.shape);
        return true;
    };

    triggerFunction(){}

    update() {
        if (this.trigger()){
            this.triggerFunction();
        }
        super.update();
    }

}





//--------------------------------------------------------------
//--------------------------------------------------------------
//--------------------------------------------------------------
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
    const layer3 = new ParallaxLayer("layer3",new Vector(0,1000),PLAYER_INDEX+5,PLAYER_INDEX+5,1,1,true,false);
    DRAW_OBJECTS.push(layer0);
    DRAW_OBJECTS.push(layer1);
    DRAW_OBJECTS.push(layer2);
    DRAW_OBJECTS.push(layer3);



    const ground = new StaticObject(new Vector(-1000,1000),PLAYER_INDEX+1,PLAYER_INDEX,null);
    ground.setShape(new AABB(ground.position,50000,500));
    COLLISION_OBJECTS.push(ground);
    buildArrows();

    //building Door
    const porte = new StaticObject(new Vector(700,664),PLAYER_INDEX,PLAYER_INDEX,null);
    porte.setShape(new AABB(porte.position.clone().add(107,35)  ,47,90));
    const portSprite1 = new Sprite('porte01',porte.position,PLAYER_INDEX-1,PLAYER_INDEX-1);
    const portSprite2 = new Sprite('porte02',porte.position.clone().add(130,0),PLAYER_INDEX+1,PLAYER_INDEX+1);
    porte.add(portSprite1);
    porte.add(portSprite2);
    COLLISION_OBJECTS.push(porte);
    DRAW_OBJECTS.push(portSprite1);
    DRAW_OBJECTS.push(portSprite2);


    //building Arc
    const arc = new MovingObject(new Vector(1500,1000), new Vector(1500,800), PLAYER_INDEX+1, PLAYER_INDEX+1);
    const arcSprite = new Sprite('arc',arc.position,PLAYER_INDEX+1, PLAYER_INDEX+1);
    arc.add(arcSprite);
    arc.shouldActivate = function() {
        return arc.endPosition.manhattanDistance(PLAYER.position) < 500;
    };
    arc.setDuration(0.5);
    arc.setEasing((t => 1 - Math.pow(1 - t, 2)));
    UPDATE_OBJECTS.push(arc);
    DRAW_OBJECTS.push(arcSprite);


    //building Eiffel

    const eiffel = new MovingObject(new Vector(1710,1000), new Vector(1710,650), PLAYER_INDEX-1, PLAYER_INDEX-1);
    const eiffelSprite = new Sprite('eiffel',eiffel.position,PLAYER_INDEX-1, PLAYER_INDEX-1);
    eiffel.add(eiffelSprite);
    eiffel.setDuration(0.5);
    eiffel.setEasing((t => 1 - Math.pow(1 - t, 2)));
    eiffel.shouldActivate = function() {
        return arc.isDone()  ;
    };
    UPDATE_OBJECTS.push(eiffel);
    DRAW_OBJECTS.push(eiffelSprite);

    //notre dame
    const notre_dame = new MovingObject(new Vector(1855,1000), new Vector(1855,750), PLAYER_INDEX-1, PLAYER_INDEX-1);
    const notre_dameSprite = new Sprite('notre_dame',notre_dame.position,PLAYER_INDEX-1, PLAYER_INDEX-1);
    notre_dame.add(notre_dameSprite);
    notre_dame.setDuration(0.5);
    notre_dame.setEasing((t => 1 - Math.pow(1 - t, 2)));
    notre_dame.shouldActivate = function() {
        return eiffel.isDone()  ;
    };
    UPDATE_OBJECTS.push(notre_dame);
    DRAW_OBJECTS.push(notre_dameSprite);




    //building Polytech
    const polytech = new MovingObject(new Vector(2500,1000), new Vector(2500,520), PLAYER_INDEX-1, PLAYER_INDEX-1);
    const polytechSprite = new Sprite('polytech_building',polytech.position,PLAYER_INDEX-1, PLAYER_INDEX-1);
    polytech.add(polytechSprite);
    polytech.shouldActivate = function() {
        return polytech.endPosition.manhattanDistance(PLAYER.position) < 400;
    };
    polytech.setDuration(4);
    polytech.setEasing((t => 1 - Math.pow(1 - t, 2)));
    UPDATE_OBJECTS.push(polytech);
    DRAW_OBJECTS.push(polytechSprite);

    const guitar_player = new Sprite('guitar_player',new Vector(3900,851),PLAYER_INDEX-3, PLAYER_INDEX-3);
    DRAW_OBJECTS.push(guitar_player);
    const music_animation = new SpriteAnimation('music_animation', new Vector(4050,751), PLAYER_INDEX-1,PLAYER_INDEX-1, 100, 100,  6);
    music_animation.addState("animation", 0, 4);
    music_animation.setState("animation");
    UPDATE_OBJECTS.push(music_animation);
    DRAW_OBJECTS.push(music_animation);


    const banner0 = new Banner( new Vector(90,600),PLAYER_INDEX-2,PLAYER_INDEX-2,
        {
        text: 'Press arrows to scroll through my resume',
        textColor : '#000000',
        fontSize: 28,
        backgroundColor: null,
        offX:20,
        offY:10,
        staggerFrames: 40
    });

    UPDATE_OBJECTS.push(banner0);
    DRAW_OBJECTS.push(banner0);



    const bannerParis = new Banner( new Vector(1590,530),PLAYER_INDEX-2,PLAYER_INDEX-2,
        {
            text: 'Live and study in Paris',
        });

    DRAW_OBJECTS.push(bannerParis);



    const bannerStudy = new Banner( new Vector(2800,530),PLAYER_INDEX-2,PLAYER_INDEX-2,
        {
            text: 'Software Engineering Student At Polytech Paris Saclay',
        });
    DRAW_OBJECTS.push(bannerStudy);


    const bannerMusic = new Banner( new Vector(3870,530),PLAYER_INDEX-2,PLAYER_INDEX-2,
        {
            text: 'Guitar player',
        });
    DRAW_OBJECTS.push(bannerMusic);


    const trigger1 = new TriggerZone(new Vector(2100,500),PLAYER_INDEX,PLAYER_INDEX,null,null);
    trigger1.setShape(new AABB(trigger1.position,400,1000));
    trigger1.trigger = function () {
        return polytech.active;
    };
    trigger1.triggerFunction = function () {
        CAMERA.shake();
    };
    UPDATE_OBJECTS.push(trigger1);




    const porte2 = new StaticObject(new Vector(4500,664),PLAYER_INDEX,PLAYER_INDEX,null);
    porte2.setShape(new AABB(porte2.position.clone().add(107,35)  ,47,90));
    const porte2Sprite1 = new Sprite('porte01',porte2.position,PLAYER_INDEX-1,PLAYER_INDEX-1);
    const porte2Sprite2 = new Sprite('porte02',porte2.position.clone().add(130,0),PLAYER_INDEX+1,PLAYER_INDEX+1);
    porte2.add(portSprite1);
    porte2.add(portSprite2);
    COLLISION_OBJECTS.push(porte2);
    DRAW_OBJECTS.push(porte2Sprite1);
    DRAW_OBJECTS.push(porte2Sprite2);

    const satellite = new MovingObject(new Vector(6000,200), new Vector(6000,520), PLAYER_INDEX-1, PLAYER_INDEX-1);
    const satelliteSprite = new SpriteAnimation('satellite', satellite.position, PLAYER_INDEX-1,PLAYER_INDEX-1, 150, 150,  6);
    satelliteSprite.addState("animation", 0, 8);
    satelliteSprite.setState("animation");
    satellite.add(satelliteSprite);
    satellite.setDuration(2);

    satellite.setEasing((t => 1 - Math.pow(1 - t, 2)));
    satellite.shouldActivate = function() {
        return satellite.endPosition.manhattanDistance(PLAYER.position) < 500;
    };
    UPDATE_OBJECTS.push(satellite);
    UPDATE_OBJECTS.push(satelliteSprite);
    DRAW_OBJECTS.push(satelliteSprite);


        /*
        var paris_cite = new SpriteShow('paris_cite',7245,0,7245,400,0.03);
        var gameB = new SpriteShowAnimation('gameB',8500,0,8500,400,0.03, 183,300,10,4);
        var smabtp = new SpriteShow('smabtp',9850,100,9850,450,0.03);
        var polytechlogo = new SpriteShow('polytechlogo',11150,0,11150,450,0.03);
        */


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

