//--------------------------------------------------------------
// Vector Class
//--------------------------------------------------------------

class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    // Add another vector to this vector
    add(other) {
        if (typeof other === 'number') {
            this.x += other;
            this.y += other;
        } else if (other instanceof Vector) {
            this.x += other.x;
            this.y += other.y;
        }
        return this;
    }

    // Subtract another vector from this vector
    subtract(other) {
        if (typeof other === 'number') {
            this.x -= other;
            this.y -= other;
        } else if (other instanceof Vector) {
            this.x -= other.x;
            this.y -= other.y;
        }
        return this;
    }

    // Multiply this vector by a scalar or another vector
    multiply(value) {
        if (typeof value === 'number') {
            this.x *= value;
            this.y *= value;
        } else if (value instanceof Vector) {
            this.x *= value.x;
            this.y *= value.y;
        }
        return this;
    }

    // Divide this vector by a scalar or another vector
    divide(value) {
        if (typeof value === 'number') {
            this.x /= value;
            this.y /= value;
        } else if (value instanceof Vector) {
            this.x /= value.x;
            this.y /= value.y;
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

    // Create a new vector with the same values as this one
    clone() {
        return new Vector(this.x, this.y);
    }

    // Returns the magnitude (length) of the vector
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    // Returns the squared magnitude (faster for comparison purposes)
    length2() {
        return this.x * this.x + this.y * this.y;
    }

    // Normalizes the vector (makes its length 1 while preserving direction)
    normalize() {
        const len = this.length();
        if (len > 0) {
            this.x /= len;
            this.y /= len;
        }
        return this;
    }

    // Calculates the dot product with another vector
    dot(other) {
        return this.x * other.x + this.y * other.y;
    }

    // Calculates the cross product with another vector
    cross(other) {
        return this.x * other.y - this.y * other.x;
    }

    // Calculates the distance to another vector
    distanceTo(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Calculates the squared distance (faster for comparison purposes)
    distanceTo2(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return dx * dx + dy * dy;
    }

    // Rotates the vector by an angle (in radians)
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const newX = this.x * cos - this.y * sin;
        const newY = this.x * sin + this.y * cos;
        this.x = newX;
        this.y = newY;
        return this;
    }

    // Returns the angle of the vector in radians
    angle() {
        return Math.atan2(this.y, this.x);
    }

    // Returns the angle between this vector and another in radians
    angleTo(other) {
        return Math.atan2(this.cross(other), this.dot(other));
    }

    // Linearly interpolates between this vector and another
    lerp(other, t) {
        this.x += (other.x - this.x) * t;
        this.y += (other.y - this.y) * t;
        return this;
    }

    // Returns a string representation of the vector
    toString() {
        return `Vector(${this.x}, ${this.y})`;
    }

    // Checks if this vector equals another (with optional epsilon for floating point precision)
    equals(other, epsilon = 0.001) {
    return (
        Math.abs(this.x - other.x) < epsilon &&
        Math.abs(this.y - other.y) < epsilon
    );
    }

    // Returns a perpendicular vector (90 degrees rotation)
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

    // Move the AABB by a vector
    translate(vec) {
        this.position.add(vec);
        return this;
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

    // Create a new AABB that combines this one with another
    merge(other) {
        const minX = Math.min(this.position.x, other.position.x);
        const minY = Math.min(this.position.y, other.position.y);
        const maxX = Math.max(this.position.x + this.width, other.position.x + other.width);
        const maxY = Math.max(this.position.y + this.height, other.position.y + other.height);

        return new AABB(
            new Vector(minX, minY),
            new Vector(maxX - minX, maxY - minY)
        );
    }
}



//--------------------------------------------------------------
//Camera
//--------------------------------------------------------------
class Camera {
    constructor(shape = new AABB()) {
        this.shape = shape;
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

    interactWithPlayer(player){}

    parentMoved(vector){}
}


class StaticObject extends Pea{
    constructor(shape, zIndex) {
        super();
        this.shape = shape;
        this.zIndex = zIndex;
    }

    interactWithPlayer(player){
        if (this.zIndex === player.zIndex){
            player.translate(player.shape.getCollisionResolution(this.shape));
        }
    }
}



class SimpleObject extends StaticObject{
    constructor(shape, zIndex) {
        super(shape, zIndex);
        this.velocity = new Vector(0, 0);
    }

    update() {
        this.shape.position.add(this.velocity);
        for (const child of this.children) {
            child.parentMoved(this.velocity);
        }
        super.update();
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

        //todo

        super.update();
    }

}





