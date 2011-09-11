
(function PongClient() {
	
	"use strict";
	
	var assets, ctx, Asset, game, me;
	
	assets = {};
	
	ctx = document.getElementById('canvas').getContext('2d');
		
	Asset = function Asset(url) {
		
		var that = this;
		
		this.ready = false;
		this.image = new Image();
		this.image.onload = function () { that.ready = true; };
		this.image.src = url;		
	};
	
	game = {
				
		init: function init() {
						
			var canvas, interval;
					
			assets.field   = new Asset('gfx/field.png');
			assets.ball    = new Asset('gfx/ball.png');
			assets.wallL   = new Asset('gfx/wall-L.png');
			assets.wallR   = new Asset('gfx/wall-R.png');
			assets.playerL = new Asset('gfx/player-L.png');
			assets.playerR = new Asset('gfx/player-R.png');
			assets.racketL = new Asset('gfx/racket-L.png');			
			assets.racketR = new Asset('gfx/racket-R.png');
			
			now.clientInit = me.init;
			now.draw = game.draw;
			
			interval = setInterval(function () {									
				if (game.ready() && now.sync !== undefined) {					
					clearInterval(interval);
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
								ctx.drawImage(assets.racketL.image, elem.left, elem.top);
							} else {
								ctx.drawImage(assets.racketR.image, elem.left, elem.top);
							}
						}
					}
				}
				
				if (player !== undefined) {
					if (player.left === 0) {
						if (counter === 0) {
							ctx.drawImage(assets.wallR.image, 983, 0);
						}
						ctx.drawImage(assets.playerL.image, player.left, player.top);
					} else {
						if (counter === 0) {
							ctx.drawImage(assets.wallL.image, 0, 0);
						}
						ctx.drawImage(assets.playerR.image, player.left, player.top);
					}
				}
				
				if (ball !== undefined) {
					ctx.drawImage(assets.ball.image, ball.left, ball.top);
				}				
			}
						
			return true;
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