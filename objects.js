function lerp(a,b,t){return a+(b-a)*t;}


class Sprite{

  constructor(imageId,x,y){
    this.image=document.getElementById(imageId);
    this.x=x;
    this.y=y;
    this.width=this.image.width;
    this.height=this.image.height;
  }


  update(camera){}


  draw(ctx,camera=null){
    if(camera==null) {tx.drawImage (this.image, this.x,  this.y);}
    else {ctx.drawImage(this.image, this.x-camera.x, this.y-camera.y, this.width, this.height);}
  }
}


/*to do fix*/
class ParallexSprite extends Sprite{

  constructor(imageId,x,y,speedModifierX,speedModifierY ){
    super(imageId,x,y);
    this.speedModifierX=speedModifierX;
    this.speedModifierY=speedModifierY;
  }

  update(camera){
    this.x += camera.speedX * this.speedModifierX;
    this.y += camera.speedY * this.speedModifierY;
  }

}



/*draw continuous background between beginX and EndX (It is RECOMMENDED that they are both multiples of the width)*/
class FiniteLayer extends Sprite{

  constructor(imageId,beginX,endX,y){
    super(imageId,beginX,y);
    this.beginX = beginX;
    this.endX = endX;
  }


  draw(ctx,camera){

    /*camera is out of bonds [beginX, endX]*/
    if( (camera.x >= this.endX) || (camera.x+camera.width <= this.beginX) ){return;}

    /*camera is in bonds [beginX, endX]*/
    if((camera.x < this.endX) && (camera.x >= this.beginX)){
      var posX = (camera.x - this.beginX)%this.width;

      if(posX + camera.width <= this.width){
        ctx.drawImage (this.image, posX, camera.y, camera.width, camera.height,0,0,camera.width,camera.height);
      }else{
        var w = this.width - posX;
        ctx.drawImage (this.image, posX, camera.y, w, camera.height,0,0,w,camera.height);

        if(camera.x + camera.width <= this.endX){
          ctx.drawImage (this.image, 0, camera.y, this.width-w, camera.height,  w, 0,this.width-w,camera.height);
        }
      }
    }



    if(camera.x+camera.width > this.beginX){
      var w = camera.x+camera.width - this.beginX;
      ctx.drawImage (this.image, 0, camera.y, w, camera.height,camera.width - w, 0,w,camera.height);
      return;
    }



  }
}



class ParallexFiniteLayer extends FiniteLayer{

  constructor(imageId,beginX,endX,y,speedModifierX,speedModifierY){

    super(imageId,beginX,endX,y);
    this.virtual_camera_x=camera.x;
    this.virtual_camera_y=camera.y;

    this.speedModifierX=speedModifierX;
    this.speedModifierY=speedModifierY;
  }

  update(camera){
    this.virtual_camera_x += camera.speedX*this.speedModifierX;
    this.virtual_camera_y += camera.speedY*this.speedModifierY;
  }

  draw(ctx,camera){

    if( (this.virtual_camera_x >= this.endX) || (this.virtual_camera_x+camera.width <= this.beginX) ){return;}


    if((this.virtual_camera_x < this.endX) && (this.virtual_camera_x >= this.beginX)){
      var posX = (this.virtual_camera_x - this.beginX)%this.width;

      if(posX + camera.width <= this.width){
        ctx.drawImage (this.image, posX, this.virtual_camera_y, camera.width, camera.height,0,0,camera.width,camera.height);
      }else{
        var w = this.width - posX;
        ctx.drawImage (this.image, posX, this.virtual_camera_y, w, camera.height,0,0,w,camera.height);

        if(this.virtual_camera_x + camera.width <= this.endX){
          ctx.drawImage (this.image, 0, this.virtual_camera_y, this.width-w, camera.height,  w, 0,this.width-w,camera.height);
        }
      }
    }



    if(this.virtual_camera_x+camera.width > this.beginX){
      var w = this.virtual_camera_x+camera.width - this.beginX;
      ctx.drawImage (this.image, 0, this.virtual_camera_y, w, camera.height,camera.width - w, 0,w,camera.height);
      return;
    }



  }
}



class InfiniteLayer extends Sprite{

  constructor(imageId){
    super(imageId,0,0);
  }


  draw(ctx,camera){
    var camera_pos_x=camera.x%this.width;
    var camera_pos_y=camera.y;
    if(camera_pos_x<0){
      camera_pos_x+=this.width;
    }

    if(camera_pos_x+camera.width<=this.width){
      ctx.drawImage (this.image, camera_pos_x, camera_pos_y, camera.width, camera.height,0, 0,camera.width,camera.height);
    }else{
      ctx.drawImage (this.image, camera_pos_x, camera_pos_y, this.width - camera_pos_x, camera.height,0, 0,this.width - camera_pos_x,camera.height);
      ctx.drawImage (this.image, this.x, camera_pos_y, camera.width - (this.width - camera_pos_x), camera.height,this.width - camera_pos_x, 0,camera.width - (this.width - camera_pos_x),camera.height);
    }
  }
}



class ParallexLayer extends Sprite {

  constructor(imageId,speedModifierX,speedModifierY){
    super(imageId,0,0);

    this.virtual_camera_x=camera.x;
    this.virtual_camera_y=camera.y;

    this.speedModifierX=speedModifierX;
    this.speedModifierY=speedModifierY;
  }


  update(camera){
    this.virtual_camera_x += camera.speedX*this.speedModifierX;
    this.virtual_camera_y += camera.speedY*this.speedModifierY;
  }


  draw(ctx,camera){
    var camera_pos_x=this.virtual_camera_x%this.width;
    var camera_pos_y=this.virtual_camera_y;

    if(camera_pos_x<0){
      camera_pos_x+=this.width;
    }

    if(camera_pos_x+camera.width<=this.width){
      ctx.drawImage (this.image, camera_pos_x, camera_pos_y, camera.width, camera.height,0, 0,camera.width,camera.height);
    }else{
      ctx.drawImage (this.image, camera_pos_x, camera_pos_y, this.width - camera_pos_x, camera.height,0, 0,this.width - camera_pos_x,camera.height);
      ctx.drawImage (this.image, this.x, camera_pos_y, camera.width - (this.width - camera_pos_x), camera.height,this.width - camera_pos_x, 0,camera.width - (this.width - camera_pos_x),camera.height);
    }
  }
}



class OccasionalParallexLayer extends ParallexLayer{

  constructor(imageId,speedModifierX,speedModifierY,x,y,buff){
    super(imageId,speedModifierX,speedModifierY);
    this.x=x;
    this.y=y;
    this.buffer = buff * this.width;
  }


  draw(ctx,camera){
    var camera_pos_x=this.virtual_camera_x%this.buffer;
    var camera_pos_y=this.virtual_camera_y;

    if(camera_pos_x<0){
      camera_pos_x+=this.width;
    }

    if(camera_pos_x >= this.x && camera_pos_x < this.x + this.width){
      ctx.drawImage (this.image, camera_pos_x-this.x, camera_pos_y, this.x + this.width - camera_pos_x, camera.height,0, 0,this.x + this.width - camera_pos_x,camera.height);
    }

    const camera_pos_x_plus_width = (this.virtual_camera_x + camera.width)%this.buffer;

    if(camera_pos_x_plus_width >= this.x && camera_pos_x_plus_width < this.x + this.width){
      ctx.drawImage (this.image, 0, camera_pos_y, camera_pos_x_plus_width - this.x, camera.height,camera.width - (camera_pos_x_plus_width - this.x), 0,camera_pos_x_plus_width - this.x,camera.height);
    }
  }






}



class SpriteShow extends Sprite {
  constructor(imageId,x,y,tx,ty,lerp){
    super(imageId,x,y);
    this.targetX = tx;
    this.targetY = ty;
    this.lerp=lerp;
    this.visible = false;
    this.active = false;
  }


  update(camera=null){
    if(this.active){
      this.x = lerp(this.x,this.targetX,this.lerp);
      this.y = lerp(this.y,this.targetY,this.lerp);
      if(this.x <= this.targetX+0.1 && this.x >= this.targetX-0.1 && this.y <= this.targetY + 0.1 && this.y >= this.targetY - 0.1)  this.active = false;
    }
  }


  draw(ctx,camera){
    if(this.visible){ctx.drawImage (this.image, this.x-camera.x, this.y-camera.y, this.width, this.height);}
  }

  activate(){this.active = true;this.visible=true;}

  /*setTarget(tx,ty){
    this.targetX = tx;
    this.targetY = ty;
  }*/

}


class SpriteShowAnimation extends SpriteShow {
  constructor(imageId,x,y,tx,ty,lerp,w,h,staggerFrames,animationFrmaes){
    super(imageId,x,y,tx,ty,lerp);
    this.width = w;
    this.height=h;
    this.frame =0;
    this.staggerFrames = staggerFrames;
    this.animationFrmaes=animationFrmaes;
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

//const ad = document.getElementById('ad');
const ad = new Image(498,50);
ad.src = 'ad.png';


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
    ctx.font='19px Times New Roman';
    ctx.fillText(text3,x-camera.x+20, y-camera.y+170);
    if(text4!=null){
        ctx.fillText(text4,x-camera.x+20, y-camera.y+200);
    }

  }


}
