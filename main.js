var socket = io.connect("http://24.16.255.56:8888");

socket.on("load", function (data) {
  gameEngine.entities = JSON.parse(data.data);
  gameEngine.entities.forEach(function(element){
    if (element.velocity){
      element = Object.setPrototypeOf(element, Spore.prototype);
    } else {
      element = Object.setPrototypeOf(element, Spawner.prototype);
      element.sound = new Audio("./pop.wav");
    }
    element.game = gameEngine;
  });
});

function save(){
  var cache = [];
  ents = JSON.stringify(gameEngine.entities, 
    function(key, value) {
      if (typeof value === 'object' && value !== null) {
          if (cache.indexOf(value) !== -1) {
              return;
          }
          cache.push(value);
      }
      return value;
    });
  console.log(ents);
  cache = null;
  socket.emit("save", { studentname: "Michael Humkey", statename: "instance1", data: ents});
}

function load(){
  socket.emit("load", { studentname: "Michael Humkey", statename: "instance1" });
}

function fillCircle(ctx, x, y, radius){
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
  ctx.fill();
}

function distance(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function Circle(game, x, y, radius, lspan) {
    this.radius = radius;
    this.life = lspan;
    Entity.call(this, game, x, y);
}

Circle.prototype = new Entity();
Circle.prototype.constructor = Circle;

Circle.prototype.collide = function (other) {
    return distance(this, other) < this.radius + other.radius;
};

Circle.prototype.collideLeft = function () {
    return (this.x - this.radius) < 0;
};

Circle.prototype.collideRight = function () {
    return (this.x + this.radius) > window.innerWidth;
};

Circle.prototype.collideTop = function () {
    return (this.y - this.radius) < 0;
};

Circle.prototype.collideBottom = function () {
    return (this.y + this.radius) > window.innerHeight;
};

Circle.prototype.update = function () {
    Entity.prototype.update.call(this);
};

function Spawner(game, x, y) {
  this.sound = new Audio("./pop.wav");
  this.sound.volume = 0.005;
  this.ctr = 0;
  Circle.call(this, game, x, y, 15, 300);
}

Spawner.prototype = new Circle();
Spawner.prototype.constructor = Spawner;

Spawner.prototype.update = function () {
  this.radius = this.life * 0.05;
  if (this.ctr++ === 50){
    this.ctr = -1;
    var nspawn = 5 + Math.ceil(10 * Math.random());
    for (i = 0; i <= nspawn; i++){
      var canvas = document.getElementById("gameWorld");
      var x = this.x + (Math.random()-0.5) * 80;
      var y = this.y + (Math.random()-0.5) * 80;
      gameEngine.addEntity(new Spore(gameEngine, x, y));
    }
    this.sound.play();
  }
  if(this.life-- <= 0){
    this.removeFromWorld = true;
  }
}

Spawner.prototype.draw = function (ctx) {
  var that = this;
  ctx.fillStyle = 'yellow';
  fillCircle(ctx, that.x, that.y, that.radius);
}

function Spore(game, x, y) {
  this.velocity = {x: (Math.random()-0.5)*240, y: (Math.random()-0.5)*240};
  Circle.call(this, game, x, y, 5, 30 + Math.ceil(Math.random() * 50));
}

Spore.prototype = new Circle();
Spore.prototype.constructor = Spawner;

Spore.prototype.update = function () {
  this.radius = this.life * 0.125;
  if(!this.life--){
    this.removeFromWorld = true;
    if (Math.random() < 0.01){
      var that = this;
      gameEngine.addEntity(new Spawner(gameEngine, that.x, that.y));
    }
  } else if (this.life > 90){
    var that = this;
    gameEngine.addEntity(new Spawner(gameEngine, that.x, that.y));
  }

  this.x += this.velocity.x * this.game.clockTick;
  this.y += this.velocity.y * this.game.clockTick;

    if (this.collideLeft() || this.collideRight()) {
        this.velocity.x = -this.velocity.x;
        if (this.collideLeft()) this.x = this.radius;
        if (this.collideRight()) this.x = window.innerWidth - this.radius;
        this.x += this.velocity.x * this.game.clockTick;
        this.y += this.velocity.y * this.game.clockTick;
    }

    if (this.collideTop() || this.collideBottom()) {
        this.velocity.y = -this.velocity.y;
        if (this.collideTop()) this.y = this.radius;
        if (this.collideBottom()) this.y = window.innerHeight - this.radius;
        this.x += this.velocity.x * this.game.clockTick;
        this.y += this.velocity.y * this.game.clockTick;
    }

    for (var i = 0; i < this.game.entities.length; i++) {
        var ent = this.game.entities[i];
        if (ent instanceof Spawner){
          if (this.collide(ent)){
            this.removeFromWorld = true;
            ent.life -= this.life;
          } else {
            //repell somehow
          }
        } else if (ent !== this && this.collide(ent)) {
            if(this.life >= ent.life){
              this.life += ent.life;
              ent.removeFromWorld = true;
            }
            var temp = { x: this.velocity.x, y: this.velocity.y };

            var dist = distance(this, ent);
            var delta = this.radius + ent.radius - dist;
            var difX = (this.x - ent.x)/dist;
            var difY = (this.y - ent.y)/dist;

            this.x += difX * delta / 2;
            this.y += difY * delta / 2;
            ent.x -= difX * delta / 2;
            ent.y -= difY * delta / 2;

            this.velocity.x = ent.velocity.x;
            this.velocity.y = ent.velocity.y;
            ent.velocity.x = temp.x;
            ent.velocity.y = temp.y;
            this.x += this.velocity.x * this.game.clockTick;
            this.y += this.velocity.y * this.game.clockTick;
            ent.x += ent.velocity.x * this.game.clockTick;
            ent.y += ent.velocity.y * this.game.clockTick;
        }

        if (ent != this && this.collide({ x: ent.x, y: ent.y, radius: this.visualRadius })) {
            var dist = distance(this, ent);
            if (this.it && dist > this.radius + ent.radius + 10) {
                var difX = (ent.x - this.x)/dist;
                var difY = (ent.y - this.y)/dist;
                this.velocity.x += difX * acceleration / (dist*dist);
                this.velocity.y += difY * acceleration / (dist * dist);
                var speed = Math.sqrt(this.velocity.x*this.velocity.x + this.velocity.y*this.velocity.y);
                if (speed > maxSpeed) {
                    var ratio = maxSpeed / speed;
                    this.velocity.x *= ratio;
                    this.velocity.y *= ratio;
                }
            }
        }
    }
}

Spore.prototype.draw = function (ctx) {
  var that = this;
  ctx.fillStyle = 'orange';
  fillCircle(ctx, that.x, that.y, that.radius);
}

var gameEngine = new GameEngine();

window.onload = function () {
    console.log("Preparing settlements");
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = false;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    gameEngine.init(ctx);
    gameEngine.start();

    socket.on("connect", function () {
        console.log("Socket connected.")
    });
    socket.on("disconnect", function () {
        console.log("Socket disconnected.")
    });
    socket.on("reconnect", function () {
        console.log("Socket reconnected.")
    });
};

