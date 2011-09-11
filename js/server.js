
require.paths.push('/usr/local/lib/node_modules');

(function PongServer() {
	
	"use strict";
	
	var data, packet, settings, boundaries, wBall, wRacket, wField, players, left, right, Ball, Player, socket, engine;
	
	data       = {};
	packet	   = {};
	
	settings   = {};
	boundaries = {};
	
	settings.cycle 	= 1000;
	settings.field  = { w: 1005, h: 585 };
	settings.racket = { w: 15,   h: 65, v: 250 / settings.cycle };
	settings.ball   = { w: 15,   h: 15, v: 250 / settings.cycle };
	
	wBall   = settings.ball.w;
	wRacket = settings.racket.w;
	wField  = settings.field.w;
	
	boundaries.ball   = { h: settings.field.h - settings.ball.h,   w: settings.field.w - wBall   };
	boundaries.racket = { h: settings.field.h - settings.racket.h, w: settings.field.w - wRacket };
		
	players = 0;	
	left    = 0;
	right   = 0;
	
	Ball = function Ball(id) {
		
		var bb, sb;
		
		this.id     = id;
		this.type   = 'ball';
		this.moving = true;
		this.hit    = 0;
		
		bb = boundaries.ball;
		sb = settings.ball;
		
		this.position = {
			top : (bb.h) / 2,
			left: (bb.w) / 2
		};
		this.velocity = {
			x: sb.v * (Math.round(Math.random()) * 2 - 1),
			y: sb.v * (Math.round(Math.random()) * 2 - 1)
		};
	};
	
	Player = function Player(id, side) {
		
		this.id     = id;
		this.type   = 'player';
		this.moving = false;
		
		this.position = {
			top : (boundaries.racket.h) / 2,
			left: side
		};
		this.velocity = {
			x: 0,
			y: settings.racket.v
		};
	};

	socket = {
		
		init: function init() {
			
			var conf, express, server;
								
			conf    = require('./conf');						
			express = require('express');
			server  = express.createServer();
			
			server.listen(conf.port);
			
			this.nowjs    = require('now');			
			this.everyone = this.nowjs.initialize(server);
			
			this.everyone.now.moving = engine.player.move;
			this.everyone.now.sync   = socket.sync;
		
			this.nowjs.on('connect', function () {
				
				var id = this.user.clientId;
				console.log('connected: ' + id);
				
				if (players === 0) {
					engine.ball.add();
				}
				
				engine.player.add(id);
				this.now.clientInit(id);
			});
						
			this.nowjs.on('disconnect', function () {
				
				console.log('disconnected: ' + this.user.clientId);
				engine.player.remove(this.user.clientId);
				
				if (players === 0) {
					packet = {};
					data   = {};
				}
			});
			
			engine.run();
		},
					
		compress: function compress(data) {
				
			var chunk = {
				id  : data.id,
				top : data.position.top + 15,
				left: data.position.left
			};

			packet[data.id] = chunk;
		},
		
		sync: function sync() {
			this.now.draw(packet);
		}
	},

	engine = {
		
		ball: {
			
			add: function add() {
				
				var id   = 'BALL';
				data[id] = new Ball(id);

				socket.compress(data[id]);
			},
			
			reset: function reset(ball, side) {
				
				var pos, vel, bb, sb;

				pos = ball.position;
				vel = ball.velocity;

				bb = boundaries.ball;
				sb = settings.ball;

				pos.top  = (bb.h) / 2;
				pos.left = (bb.w) / 2;

				vel.y = sb.v * (Math.round(Math.random()) * 2 - 1);
				vel.x = -sb.v;
				if (side === -wBall) {
					vel.x = -vel.x;
				}

				socket.compress(ball);
			}
		},
		
		player: {
			
			add: function add(id) {
				
				var side;

				if (right < left) {
					side  = wRacket;
					right = right + 1;
				} else {
					left  = left  + 1;
					side  = 0;
				}

				players  = players + 1;
				data[id] = new Player(id, side);

				socket.compress(data[id]);
			},
			
			move: function move(type, code) {
				
				var player, velocity;

				player = data[this.user.clientId];
				velocity = 1;

				if (type === 'keydown' && player.moving === false) {

					player.moving = true;
					if (code === 38) velocity = -1;
					player.velocity.y = Math.abs(player.velocity.y) * velocity;

				} else if (type === 'keyup' && player.moving === true) {

					player.moving = false;
					if (code === 40) velocity = -1;
					player.velocity.y = Math.abs(player.velocity.y) * velocity;
				}				
			},
			
			remove: function remove(id) {
				
				if (data[id].position.left === 0) {
					left  = left  - 1;
				} else {
					right = right - 1;
				}

				players = players - 1;
				delete packet[id];
				delete data[id];				
			}
		},
				
		run: function run() {
			
			var that = this;
			
			this.lastUpdateTime = new Date().getTime();
			this.idealCycleTime = 1000 / settings.cycle;
			this.leftover = 0;			
			
			setInterval(function () { that.tick(); }, this.idealCycleTime);
		},
		
		tick: function tick() {
			
			var thisUpdateTime, timeSinceDoLogic, updatesToProcess, i;

			thisUpdateTime = new Date().getTime();
			timeSinceDoLogic = (thisUpdateTime - this.lastUpdateTime) + this.leftover;
			i = updatesToProcess = Math.floor(timeSinceDoLogic / this.idealCycleTime);
			
			if (i > 0) {
				while (i--) {
					this.update();
				}
			}

			this.leftover = timeSinceDoLogic - (updatesToProcess * this.idealCycleTime);
		    this.lastUpdateTime = thisUpdateTime;
		},
		
		update: function update() {
			
			var id, obj, pos, vel, isBall, hLimit, wLimit, newTop, newLeft;
						
			for (id in data) {
				if (data.hasOwnProperty(id)) {
					obj = data[id];
					
					if (obj.moving === true) {
						
						pos = obj.position;
						vel = obj.velocity;

						isBall = (obj.type === 'ball');
						hLimit = boundaries.racket.h;			
						if (isBall) {
							hLimit = boundaries.ball.h;
						}

						newTop = pos.top + vel.y;
						newTop = Math.max(0, newTop);
						newTop = Math.min(newTop, hLimit);
						
						pos.top = newTop;

						if (isBall) {
							if (newTop === 0 || newTop === hLimit) {
								vel.y = -vel.y;
							}

							wLimit = boundaries.racket.w - wBall;
							newLeft = pos.left + vel.x;

							if (pos.left <= wRacket || pos.left >= wLimit) {
								newLeft = Math.max(-wBall, newLeft);
								newLeft = Math.min(newLeft, wField);
							} else {
								newLeft = Math.max(wRacket, newLeft);
								newLeft = Math.min(newLeft, wLimit);
							}
							pos.left = newLeft;

							if (newLeft === wRacket || newLeft === wLimit) {								
								this.collision(obj, newLeft);
							} else if (newLeft === -wBall || newLeft === wField) {
								this.ball.reset(obj, newLeft);
								this.score(newLeft);
							}
						}
					}
					
					socket.compress(obj);
				}
			}
		},
		
		collision: function collision(obj, side) {
			
			var isLeft, offsetLeft, objTop, objSpace, id, racket, racketLeft, racketTop;
									
			isLeft = (side === wRacket);
			if ((isLeft && left === 0) || (!isLeft && right === 0)) {
				
				obj.velocity.x = -obj.velocity.x;
				this.velocity(obj);
			
			} else {
								
				offsetLeft = boundaries.racket.w;
				objTop = obj.position.top;
				objSpace = objTop + settings.ball.h;
						
				for (id in data) {
					if (data.hasOwnProperty(id) && data[id].type === 'player') {
						racket = data[id];
						racketLeft = racket.position.left;		
						if ((isLeft && racketLeft === 0) || (!isLeft && racketLeft === offsetLeft)) {		
							racketTop = racket.position.top;
							if (racketTop < objSpace && objTop < racketTop + settings.racket.h) {
								obj.velocity.x = -obj.velocity.x;
								this.velocity(obj);
								break;
							}
						}
					}
				}
			}	
		},
		
		velocity: function velocity(obj) {
			
			var value, vel;			
			
			vel = obj.velocity;
			if (obj.hit === 5) {
				for (value in vel) {
					if (vel.hasOwnProperty(value)) {
						if (vel[value] < 0) {
							vel[value] = vel[value] - (50 / settings.cycle);
						} else {
							vel[value] = vel[value] + (50 / settings.cycle);
						}						
					}
				}
				obj.hit = 0;
			} else {
				obj.hit = obj.hit + 1;
			}
		},
		
		score: function score(side) {
			// TODO: add a point!
		}
	};
			
	socket.init();
	
}());