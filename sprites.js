class Sprite {
    constructor(imageId, x, y, zIndex) {
        this.image = getImage(imageId);
        this.x = x;
        this.y = y;
        this.zIndex = zIndex;

        if (this.image) {
            this.width = this.image.width;
            this.height = this.image.height;
        } else {
            this.width = 0;
            this.height = 0;
            console.warn(`Image not found for sprite: ${imageId}`);
        }
    }

    update() {}

    draw(ctx, camera = null) {
        if (!this.image) return;
        const drawX = camera ? this.x - camera.shape.position.x : this.x;
        const drawY = camera ? this.y - camera.shape.position.y : this.y;
        ctx.drawImage(this.image, drawX, drawY, this.width, this.height);
    }
}



class ParallaxLayer extends Sprite {
    constructor(imageId, x, y, zIndex, speedModifierX = 1, speedModifierY = 1, repeatX = true, repeatY = false) {
        super(imageId, x, y, zIndex);
        this.speedModifierX = speedModifierX;
        this.speedModifierY = speedModifierY;
        this.repeatX = repeatX;
        this.repeatY = repeatY;
    }

    update() {}

    draw(ctx, camera = null) {
        if (!this.image || !camera) return;

        const camPos = camera.shape.position;
        const camSize = camera.shape.size;

        const offsetX = camPos.x * this.speedModifierX;
        const offsetY = camPos.y * this.speedModifierY;

        // Anchor-based parallax position
        const baseX = this.x - offsetX;
        const baseY = this.y - offsetY;

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

        const endX = this.repeatX ? camSize.x + this.width : baseX + 1;
        const endY = this.repeatY ? camSize.y + this.height : baseY + 1;

        for (let y = startY; y < endY; y += this.height) {
            for (let x = startX; x < endX; x += this.width) {
                ctx.drawImage(this.image, x, y, this.width, this.height);
            }
        }
    }
}






class SpriteAnimation extends Sprite {
    constructor(imageId,x,y,tx,ty,lerp,w,h,staggerFrames,animationFrmaes){
        super(imageId,x,y,tx,ty,lerp);
        this.width = w;
        this.height=h;
        this.frame =0;
        this.staggerFrames = staggerFrames;
        this.animationFrmaes=animationFrmaes;

        this.image.onload = () => {
            this.width = w;
            this.height = h;
            this.isLoaded.resolve();
        };
    }

    update(camera=null){
        if(this.active){
            ++this.frame;
            this.frame = this.frame % 216000;
            this.x = lerp(this.x,this.targetX,this.lerp);
            this.y = lerp(this.y,this.targetY,this.lerp);
            if(this.x <= this.targetX+1 && this.x >= this.targetX-1 && this.y <= this.targetY + 1 && this.y >= this.targetY - 1)  this.active = false;
        }
    }

    draw(ctx,camera){
        if(this.visible){
            var position = Math.floor(this.frame/this.staggerFrames) % this.animationFrmaes;
            var frameX = this.width * position;
            var frameY = 0;
            ctx.drawImage(this.image, frameX, frameY, this.width, this.height, this.x-camera.x, this.y-camera.y,this.width, this.height);
        }
    }
}
