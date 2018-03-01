function fillCircle(ctx, x, y, radius){
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
  ctx.fill();
}

function Spawner(game, x, y) {
  this.radius = 30;
  this.life = 800;
  this.ctr = 0;
  Entity.call(this, game, x, y);
}

Spawner.prototype = new Entity();
Spawner.prototype.constructor = Spawner;

Spawner.prototype.update = function () {
  if (this.ctr++ === 200){
    this.ctr = -1;
    var nspawn = 5 + Math.ceil(10 * Math.random());
    for (i = 0; i <= nspawn; i++){
      var canvas = document.getElementById("gameWorld");
      var x = Math.random() * canvas.width;
      var y = Math.random() * canvas.height;
      gameEngine.addEntity(new Spore(gameEngine, x, y));
    }
  }
  if(!this.life--){
    this.removeFromWorld = true;
  }
}

Spawner.prototype.draw = function (ctx) {
  var that = this;
  ctx.fillStyle = 'yellow';
  fillCircle(ctx, that.x, that.y, that.radius);
}

function Spore(game, x, y) {
  this.speed = 30;
  this.radius = 10;
  this.life = 50 + Math.ceil(Math.random() * 200);
  Entity.call(this, game, x, y);
}

Spore.prototype = new Entity();
Spore.prototype.constructor = Spawner;

Spore.prototype.update = function () {
  this.x += (Math.random()-0.5)*this.speed;
  this.y += (Math.random()-0.5)*this.speed;
  if(!this.life--){
    this.removeFromWorld = true;
    if (Math.random() < 0.06){
      var that = this;
      gameEngine.addEntity(new Spawner(gameEngine, that.x, that.y));
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
};

