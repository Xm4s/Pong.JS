
(function PongClient() {
	
	"use strict";
	
	var assets, ctx, Asset, game, me;
	
	assets = {};
	
	ctx = document.getElementById('canvas').getContext('2d');
		
	Asset = function Asset(type, url) {
		
		var that, interval;
		
		that = this;
		this.ready = false;
		
		if (type === 'image') {
			this.image = new Image();
			this.image.onload = function () { that.ready = true; };
			this.image.src = url;
		} 
		else if (type === 'sound') {
			this.sound = new Audio();
			this.sound.playing = false;
			
			this.sound.onplaying = function () { that.sound.playing = true; }
			this.sound.onended   = function () { that.sound.playing = false; }
			
			this.sound.src = url;
			interval = setInterval(function() {
				if(that.sound.readyState) {
					clearInterval(interval);
					that.ready = true;
				}
			}, 13);
		}		
	};
	
	game = {
				
		init: function init() {
						
			var canvas, interval;
					
			assets.field   = new Asset('image', 'assets/gfx/field.png');
			assets.ball    = new Asset('image', 'assets/gfx/ball.png');
			assets.wallL   = new Asset('image', 'assets/gfx/wall-L.png');
			assets.wallR   = new Asset('image', 'assets/gfx/wall-R.png');
			assets.playerL = new Asset('image', 'assets/gfx/player-L.png');
			assets.playerR = new Asset('image', 'assets/gfx/player-R.png');
			assets.racketL = new Asset('image', 'assets/gfx/racket-L.png');			
			assets.racketR = new Asset('image', 'assets/gfx/racket-R.png');
			
			assets.pong    = new Asset('sound', 'assets/sounds/pong.wav');
			
			interval = setInterval(function () {
				if (game.ready() && now.sync !== undefined) {
					clearInterval(interval);
					
					now.clientInit = me.init;
					now.draw  = game.draw;
					now.sound = game.sound;
					
					game.run();
				}
			}, 13);
		},
		
		ready: function ready() {
			
			var asset;
						
			for (asset in assets) {
				if (assets.hasOwnProperty(asset)) {
					if (assets[asset].ready === false) {
						return false;
					}
				}
			}
			return true;
		},
		
		run: function run() {
			
			var draw, requestAnimationFrame;
			
			draw = function () { now.sync(); setTimeout(draw, 1000 / 60); };
			requestAnimationFrame = window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;
		    
			if (requestAnimationFrame) {
				draw = function () { now.sync(); requestAnimationFrame(draw); };
		    }
		
			draw();
		},
		
		draw: function draw(data) {
			
			var counter, ball, player, id, elem;
			
			counter = 0;		
			ctx.drawImage(assets.field.image, 0, 0);
			
			if (data !== undefined) {
				
				for (id in data) {
					if (data.hasOwnProperty(id)) {
						elem = data[id];
						if (elem.id === 'BALL') {
							ball = elem;
						} else if (elem.id === me.id) {
							player = elem;
						} else {
							counter = counter + 1;
							if (elem.left === 0) {
								ctx.drawImage(assets.racketL.image, 0, elem.top);
							} else {
								ctx.drawImage(assets.racketR.image, 990, elem.top);
							}
						}
					}
				}
				
				if (player !== undefined) {
					if (player.left === 0) {
						if (counter === 0) {
							ctx.drawImage(assets.wallR.image, 983, 0);
						}
						ctx.drawImage(assets.playerL.image, 0, player.top);
					} else {
						if (counter === 0) {
							ctx.drawImage(assets.wallL.image, 0, 0);
						}
						ctx.drawImage(assets.playerR.image, 990, player.top);
					}
				}
				
				if (ball !== undefined) {
					ctx.drawImage(assets.ball.image, ball.left, ball.top);
				}				
			}
						
			return true;
		},
		
		sound: function sound() {
			
			var effect = assets.pong.sound;
			if (!effect.playing) {
				effect.play();
			}
		}
	};
					
	me = {
		
		init: function init(id) {
			
			me.id = id;
												
			window.addEventListener('keydown', me.moving, true);
			window.addEventListener('keyup',   me.moving, true);
		},
		
		moving: function moving(e) {
			
			var type, code;
			
			type = e.type;
			code = e.keyCode;
						
			if (code === 38 || code === 40) {		
				e.preventDefault();
				now.moving(type, code);				
			}
		}
	};
	
	$(document).ready(function () { game.init(); });
	
}());