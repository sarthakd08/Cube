/********************** EVENT RELATED STUFF *****************/
var allEvents = new RotateEvents();
var pointer;

RotateEvents.prototype.apply = function(name, args) {
  console.log('Adding Eventttttt', name);
  var events = this.events[name];
  if (events) {
    var i = events.length;
    while(i--) {
      if (events[i]) {
        events[i].call(this, args);
        if (events[i].once) {
          delete events[i];
        }
      }
    }
  }
  return this;
}
RotateEvents.prototype.remove = function(name, fn) {
  if (name) {
    var events = this.events[name];
    if (events) {
      if (fn) {
        var i = events.indexOf(fn);
        if (i != -1) {
          delete events[i];
        }
      } else {
        delete this.events[name];
      }
    }
  } else {
    delete this.events;
    this.events = { };
  }
  return this;
}

RotateEvents.prototype.attach = function(name, fn) {
  console.log('1111111111');
  var events = this.events[name];
  if (events == undefined) {
    this.events[name] = [ fn ];
    this.apply('event:on', fn);
  } else {
    if (events.indexOf(fn) == -1) {
      events.push(fn);
      this.apply('event:on', fn);
    }
  }
  return this;
}


function addMove(element, type, handler) {
  if(element.addEventListener) {
    element.addEventListener(type, handler, false);
  } else {
    element.attachEvent('on' + type, handler);
  }
}

allEvents.addEvent = function(obj) {
  obj.events = { };
}
allEvents.implement = function(fn) {
  fn.prototype = Object.create(RotateEvents.prototype);
}



var matchRotatingEvent = (function () {
  var styles = window.getComputedStyle(document.documentElement, ''),
    pre = (Array.prototype.slice
      .call(styles)
      .join('') 
      .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
    )[1],
    dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];
    pointer = {
    dom: dom,
    lowercase: pre,
    css: '-' + pre + '-',
    js: pre[0].toUpperCase() + pre.substr(1)
  };
})();

function RotateEvents() {
  this.events = { };
}


/*************** CONTAINER RELATED STUFF *************/

function PageContainer(data) {
  allEvents.addEvent(this);
  var self = this;
  this.element = data.element;
  this.fps = data.fps;
  this.sensivity = data.sensivity;
  this.sensivityFade = data.sensivityFade;
  this.touchSensivity = data.touchSensivity;
  this.speed = data.speed;
  this.positionX = 1000;
  this.positionY = 100;
  this.accelerationX = 0;
  this.accelerationY = 0;
  this.previousPositionX = 0;
  this.previousPositionY = 0;
  this.lastX = 0;
  this.lastY = 0;
  this.mouseX = 0;
  this.mouseY = 0;
  this.distanceX = 0;
  this.distanceY = 0;

  addMove(document, 'mousedown', function() {
    self.down = true;
  });
  addMove(document, 'mouseup', function() {
    self.down = false;
  });
  addMove(document, 'touchstart', function(e) {

    self.down = true;
    e.touches ? e = e.touches[0] : null;
    self.mouseX = e.pageX / self.touchSensivity;
    self.mouseY = e.pageY / self.touchSensivity;
    self.lastX  = self.mouseX;
    self.lastY  = self.mouseY;
  });
  addMove(document, 'keyup', function() {
    self.down = false;
  });
  addMove(document, 'mousemove', function(e) {
    self.mouseX = e.pageX;
    self.mouseY = e.pageY;
  });
  addMove(document, 'touchmove', function(e) {
    if(e.preventDefault) { 
      e.preventDefault();
    }

    if(e.touches.length == 1) {
      e.touches ? e = e.touches[0] : null;
      self.mouseX = e.pageX / self.touchSensivity;
      self.mouseY = e.pageY / self.touchSensivity;

    }
  });
  addMove(document, 'touchend', function(e) {
    self.down = false;
  });  

  setInterval(this.rotate.bind(this), this.fps);

}
allEvents.implement(PageContainer);

/* Function to Rotate Cube */
PageContainer.prototype.rotate = function() {
  this.distanceX = (this.mouseX - this.lastX);
  this.distanceY = (this.mouseY - this.lastY);
  this.lastX = this.mouseX;
  this.lastY = this.mouseY;

  if(Math.abs(this.accelerationX) > 1 || Math.abs(this.accelerationY) > 1) {
    if(!this.down) {
      this.accelerationX *= this.sensivityFade;
      this.accelerationY *= this.sensivityFade;
    }

    this.positionY -= this.accelerationY;

    if(this.positionY > 90 && this.positionY < 270) {
      this.positionX -= this.accelerationX;

      if(!this.upsideDown) {
        this.upsideDown = true;
        this.apply('upsideDown', { upsideDown: this.upsideDown });
      }

    } else {

      this.positionX += this.accelerationX;

      if(this.upsideDown) {
        this.upsideDown = false;
        this.apply('upsideDown', { upsideDown: this.upsideDown });
      }
    }

    if(this.calculatedSide !== this.currentSide) {
      this.currentSide = this.calculatedSide;
      this.apply('flipSideWise');
    }

  }

  if(this.down) {
    this.accelerationX = this.accelerationX * this.sensivityFade + (this.distanceX * this.speed - this.accelerationX) * this.sensivity;
    this.accelerationY = this.accelerationY * this.sensivityFade + (this.distanceY * this.speed - this.accelerationY) * this.sensivity;
  }

  this.element.style[pointer.js + 'Transform'] = 'rotateX(' + this.positionY + 'deg) rotateY(' + this.positionX + 'deg)';

}




/**************** Cube Action Related Stuff ********************/

function RotatingCube(data) {
  var self = this;
  this.element = data.element;
  this.sides = this.element.getElementsByClassName('side');
  this.action = data.action;
  this.action.attach('flipSideWise', function() {
    self.flipSideWise();
  });
  this.action.attach('upsideDown', function(obj) {
    self.upsideDown(obj);
  });

}
RotatingCube.prototype.rotateSides = function() {
  var action = this.action;
  if(action.positionY > 90 && action.positionY < 270) {
    this.sides[0].getElementsByClassName('inner')[0].style[pointer.js + 'Transform'] = 'rotate(' + (action.positionX + action.accelerationX) + 'deg)';
    this.sides[5].getElementsByClassName('inner')[0].style[pointer.js + 'Transform'] = 'rotate(' + -(action.positionX + 180 + action.accelerationX) + 'deg)';
  } else {
    this.sides[0].getElementsByClassName('inner')[0].style[pointer.js + 'Transform'] = 'rotate(' + (action.positionX - action.accelerationX) + 'deg)';
    this.sides[5].getElementsByClassName('inner')[0].style[pointer.js + 'Transform'] = 'rotate(' + -(action.positionX + 180 - action.accelerationX) + 'deg)';
  }
}
RotatingCube.prototype.upsideDown = function(obj) {

  var deg = (obj.upsideDown == true) ? '180deg' : '0deg';
  var i = 5;

  while(i > 0 && --i) {
    this.sides[i].getElementsByClassName('inner')[0].style[pointer.js + 'Transform'] = 'rotate(' + deg + ')';
  }

}
RotatingCube.prototype.flipSideWise = function() {
  console.log('Rotating sidewisss');
  for(var i = 0; i < this.sides.length; ++i) {
    this.sides[i].getElementsByClassName('inner')[0].className = 'inner';    
  }
  this.sides[this.action.currentSide - 1].getElementsByClassName('inner')[0].className = 'inner active';
}

var action = new PageContainer({
  element: document.getElementsByClassName('cube')[0],fps: 40,sensivity: .1,sensivityFade: .88,speed: 2.3});

new RotatingCube({action: action, element: document.getElementsByClassName('cube')[0]});
