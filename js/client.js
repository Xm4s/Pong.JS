
(function PongClient() {
	
	"use strict";
	
	var ball, player, left, right, assets, Asset, Element, game, socket, me;
	
	left   = {};
	right  = {};
	assets = {};
	
	Asset = function Asset(url) {
		
		var that = this;
		
		this.ready = false;
		this.image = new Image();
		this.image.onload = function () { that.ready = true; };
		this.image.src = url;		
	};
	
	Element = function Element(data) {
		
		this.id   = data.id,
		this.top  = data.top + 15,		
		this.left = data.left
	};
	
	game = {
				
		init: function init() {
						
			var canvas, interval;
						
			canvas   = document.getElementById('canvas');
			this.ctx = canvas.getContext('2d');
					
			assets.field   = new Asset('gfx/field.png');
			assets.ball    = new Asset('gfx/ball.png');
			assets.wallL   = new Asset('gfx/wall-L.png');
			assets.wallR   = new Asset('gfx/wall-R.png');
			assets.playerL = new Asset('gfx/player-L.png');
			assets.playerR = new Asset('gfx/player-R.png');
			assets.racketL = new Asset('gfx/racket-L.png');			
			assets.racketR = new Asset('gfx/racket-R.png');
			
			interval = setInterval(function () {									
				if (game.ready()) {
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
			
			draw = function () { if (game.draw()) setTimeout(draw, 1000 / 60); };
			requestAnimationFrame = window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;
		    
			if (requestAnimationFrame) {
				draw = function () { if (game.draw()) requestAnimationFrame(draw); };
		    }
		
			socket.init();
		    draw();			
		},
		
		update: function update(elem) {
			
			if (elem.id.match(/ball-/gi)) {
				
				if (ball === undefined) {
					ball = new Element(elem);				
				} else {								
					ball.top  = elem.top + 15;
					ball.left = elem.left;
				}
				
			} else if (elem.id === me.id) {
				
				if (player === undefined) {
					player = new Element(elem);				
				} else {								
					player.top  = elem.top + 15;
					player.left = elem.left;
				}
				
			} else if (elem.left === 0) {
				
				if (!left.hasOwnProperty(elem.id)) {
					left[elem.id] = new Element(elem);				
				} else {								
					left[elem.id].top  = elem.top + 15;
					left[elem.id].left = elem.left;
				}
			
			} else {
				
				if (!right.hasOwnProperty(elem.id)) {
					right[elem.id] = new Element(elem);				
				} else {								
					right[elem.id].top  = elem.top + 15;
					right[elem.id].left = elem.left;
				}
			}
		},
		
		draw: function draw() {
			
			var id, elem, counter;			
			
			counter = 0;
			
			this.ctx.drawImage(assets.field.image, 0, 0);
			
			for (id in left) {
				if (left.hasOwnProperty(id)) {
					this.ctx.drawImage(assets.racketL.image, 0, left[id].top);
					counter = counter + 1;
				}
			}
			
			for (id in right) {
				if (right.hasOwnProperty(id)) {
					this.ctx.drawImage(assets.racketR.image, 990, right[id].top);
					counter = counter + 1;					
				}
			}
			
			if (player !== undefined) {
				if (player.left === 0) {
					if (counter === 0) {
						this.ctx.drawImage(assets.wallR.image, 983, 0);
					}
					this.ctx.drawImage(assets.playerL.image, 0, player.top);
				} else {
					if (counter === 0) {
						this.ctx.drawImage(assets.wallL.image, 0, 0);
					}
					this.ctx.drawImage(assets.playerR.image, 990, player.top);
				}
			}
			
			if (ball !== undefined) {
				
				console.log(ball.left + ' - ' + ball.top);
				
				this.ctx.drawImage(assets.ball.image, ball.left, ball.top);
			}
			
			return true;	
		}
	};
		
	socket = {
						
		init: function init() {
					
			this.io = io.connect(conf.server, {'port': conf.port});			
			this.io.on('message', function (data) {
								
				var id, elem;						
				if (data.hasOwnProperty('id')) {
										
					id = data.id;					
					if (player === undefined) {						
						me.init(data);
					} else if (data.left === 0) {
						delete left[id];
					} else {
						delete right[id];
					}
				
				} else {
					
					for (id in data) {
						if (data.hasOwnProperty(id)) {
							game.update(data[id]);
						}
					}						
				}								
			});			
		}	
	};
				
	me = {
		
		init: function init(elem) {
			
			this.id = elem.id;		
			this.isMoving = false;
						
			window.addEventListener('keydown', this.onMove, true);
			window.addEventListener('keyup',   this.onMove, true);
		},
		
		onMove: function onMove(e) {
									
			var keycode, type, data;
			
			keycode = e.keyCode;
			type    = e.type;
							
			if (keycode === 38 || keycode === 40) {		
				e.preventDefault();
			
				if (type === 'keydown' && me.isMoving === false) {
				
					me.isMoving = true;
					data = {
						moving: me.isMoving,
						velocity: {
							y: 1
						}
					};
					
					if (keycode === 38) {
						data.velocity.y = -1;
					}
					socket.io.json.send(data);
				
				} else if (type === 'keyup' && me.isMoving === true) {
				
					me.isMoving = false;
					data = {
						moving: me.isMoving,
						velocity: {
							y: -1
						}
					};
					
					if (keycode === 38) {
						data.velocity.y = 1;
					}
					socket.io.json.send(data);
				}
			}
		}
	};
	
	$(document).ready(function () { game.init(); });
	
}());