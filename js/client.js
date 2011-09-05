
(function PongClient() {
	
	"use strict";
	
	var data, Asset, Element, game, socket, me;
	
	data = {};
	
	Asset = function Asset(url) {
		
		var that = this;
		
		this.ready = false;
		this.asset = new Image();
		this.asset.onload = function () { that.ready = true; };
		this.asset.src = url;
	};
	
	Element = function Element(data) {
		
		this.id   = data.id;
		this.type = data.type;
		this.top  = data.position.top + 15;
		this.left = data.position.left;
	};
	
	game = {
				
		init: function init() {
						
			var that, canvas, interval;
			
			that = this;
			
			canvas   = document.getElementById("canvas");
			this.ctx = canvas.getContext("2d");
			
			this.field  = new Asset("gfx/bg.jpg");
			this.ball   = new Asset("gfx/ball.jpg");
			this.player = new Asset("gfx/player.jpg");
			this.racket = new Asset("gfx/racket.jpg");
			
			interval = setInterval(function () {		
				if (game.field.ready && game.ball.ready && game.player.ready && game.racket.ready) {
					clearInterval(interval);
					that.run();
				}
			}, 13);
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
		
		draw: function draw() {
			
			var id, elem, ball, player;
			
			this.ctx.drawImage(this.field.asset, 0, 0);	
			
			for (id in data) {
				if (data.hasOwnProperty(id)) {
					elem = data[id];
					if (elem.type === 'ball') {
						ball = elem;
					} else if (elem.id === me.id) {
						player = elem;
					} else {
						this.ctx.drawImage(this.racket.asset, elem.left, elem.top);
					}
				}
			}
			
			if (player !== undefined) {
				this.ctx.drawImage(this.player.asset, player.left, player.top);
			}
			
			if (ball !== undefined) {
				this.ctx.drawImage(this.ball.asset, ball.left, ball.top);
			}
			
			return true;	
		}
	};
		
	socket = {
						
		init: function init() {
						
			this.io = io.connect(conf.server, {'port': conf.port});			
			this.io.on('message', function (msg) {
				
				var id, obj, elem;						
				if (msg.hasOwnProperty('id')) {
					
					id = msg.id;					
					if (!data.hasOwnProperty(id)) {
						me.init(msg);
					} else {
						delete data[id];
					}
				
				} else {
					
					for (id in msg) {
						if (msg.hasOwnProperty(id)) {
							obj = msg[id];
							if (!data.hasOwnProperty(obj.id)) {
								data[obj.id] = new Element(obj);
							} else {
								elem      = data[obj.id];
								elem.top  = obj.position.top + 15;
								elem.left = obj.position.left;
							}
						}
					}					
				}								
			});			
		}	
	};
				
	me = {
		
		init: function init(obj) {
			
			this.id = obj.id;		
			this.isMoving = false;
			
			data[obj.id] = new Element(obj);
			
			window.addEventListener('keydown', this.onMove, true);
			window.addEventListener('keyup',   this.onMove, true);
		},
		
		onMove: function onMove(e) {
									
			var that, keycode, type, data;
			
			that = me;
			keycode = e.keyCode;
			type = e.type;
								
			if (keycode === 38 || keycode === 40) {		
				e.preventDefault();
			
				if (type === 'keydown' && that.isMoving === false) {
				
					that.isMoving = true;
					data = {
						moving: that.isMoving,
						velocity: {
							y: 1
						}
					};
					
					if (keycode === 38) {
						data.velocity.y = -1;
					}
					socket.io.json.send(data);
				
				} else if (type === 'keyup' && that.isMoving === true) {
				
					that.isMoving = false;
					data = {
						moving: that.isMoving,
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