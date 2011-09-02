
(function PongClient() {
	
	"use strict";
	
	var Asset, Element, game, socket, all, me;
	
	Asset = function Asset(url) {
		
		var that = this;
		
		this.ready = false;
		this.img = new Image();
		this.img.onload = function () { that.ready = true; };
		this.img.src = url;
		
		return this;
	};
	
	Element = function Element(data) {
		
		this.id = data.id;
		this.type = data.type;
		this.top = data.position.top;
		this.left = data.position.left;
		
		return this;
	};
	
	game = {
				
		init: function init() {
			
			var canvas, interval;
			
			canvas = document.getElementById("canvas");
			this.ctx = canvas.getContext("2d");
			
			this.field = new Asset("gfx/bg.jpg");
			this.ball = new Asset("gfx/ball.jpg");
			this.player = new Asset("gfx/player.jpg");
			this.racket = new Asset("gfx/racket.jpg");
			
			interval = setInterval(function () {		
				if (game.field.ready && game.ball.ready && game.player.ready && game.racket.ready) {
					clearInterval(interval);
					socket.init();					
				}
			}, 100);
		},
		
		update: function update(data) {

			var id, elem;

			id = data.id;
			if (all.hasOwnProperty(id)) {
				elem = all[id];
				elem.top = data.position.top;
				elem.left = data.position.left;
			}
		},
		
		draw: function render(data) {
			
			var ball, elem, player;
			
			this.ctx.drawImage(this.field.img, 0, 0);	
			
			for (elem in all) {
				if (all.hasOwnProperty(elem)) {
					elem = all[elem];
					if (elem.type === 'ball') {
						this.ctx.drawImage(this.ball.img, elem.left, elem.top + 15);
					} else if (elem.id !== me.id) {
						this.ctx.drawImage(this.racket.img, elem.left, elem.top + 15);
					}
				}
			}
			
			player = all[me.id];
			this.ctx.drawImage(this.player.img, player.left, player.top + 15);
		}
	};
		
	socket = {
						
		init: function init() {
						
			this.io = io.connect(conf.server, {'port': conf.port});
			this.io.on('message', function (data) {
				
				var id, obj, elem;						
				if (data.hasOwnProperty('id')) {
					
					id = data.id;					
					if (!all.hasOwnProperty(id)) {
						me.init(data);
					} else {
						delete all[id];
					}
				
				} else {
					
					for (obj in data) {
						if (data.hasOwnProperty(obj)) {
							elem = data[obj];
							if (!all.hasOwnProperty(elem.id)) {
								all[elem.id] = new Element(elem);
							}
							game.update(elem);
						}
					}					
				}
				
				game.draw();
			});
		}	
	};
	
	all = {};
			
	me = {
		
		init: function init(data) {
			
			this.id = data.id;		
			this.isMoving = false;
			
			all[data.id] = new Element(data);
			
			window.addEventListener('keydown', this.onMove, true);
			window.addEventListener('keyup', this.onMove, true);
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
							y: 5
						}
					};
					
					if (keycode === 38) {
						data.velocity.y = -5;
					}
					socket.io.json.send(data);
				
				} else if (type === 'keyup' && that.isMoving === true) {
				
					that.isMoving = false;
					data = {
						moving: that.isMoving,
						velocity: {
							y: -5
						}
					};
					
					if (keycode === 38) {
						data.velocity.y = 5;
					}
					socket.io.json.send(data);
				}
			}
		}
	};
	
	$(document).ready(function () { game.init(); });
	
}());