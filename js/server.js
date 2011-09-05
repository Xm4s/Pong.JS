
require.paths.push('/usr/local/lib/node_modules');

(function PongServer() {
	
	"use strict";
	
	var settings, boundaries, data, wBall, wRacket, wField, playersCounter, leftPlayers, rightPlayers, Ball, Player, server, game;
	
	settings   = {};
	boundaries = {};
	data       = {};
	
	settings.cycle 	= 500;
	settings.field  = { w: 1005, h: 585 };
	settings.racket = { w: 15,   h: 65, v: 250 / settings.cycle };
	settings.ball   = { w: 15,   h: 15, v: 250 / settings.cycle };
	
	wBall   = settings.ball.w;
	wRacket = settings.racket.w;
	wField  = settings.field.w;
	
	boundaries.ball   = { h: settings.field.h - settings.ball.h,   w: settings.field.w - wBall   };
	boundaries.racket = { h: settings.field.h - settings.racket.h, w: settings.field.w - wRacket };
	
	playersCounter = 0;	
	leftPlayers    = 0;
	rightPlayers   = 0;
	
	Ball = function Ball(id) {
		
		this.id     = id;
		this.type   = 'ball';
		this.moving = true;
		this.hit    = 0;
		
		this.velocity = {
			x: settings.ball.v * (Math.round(Math.random()) * 2 - 1),
			y: settings.ball.v * (Math.round(Math.random()) * 2 - 1)
		};
		this.position = {
			top: (boundaries.ball.h) / 2,
			left: (boundaries.ball.w) / 2
		};
	};
	
	Player = function Player(id, left) {
		
		this.id     = id;
		this.type   = 'player';
		this.moving = false;
		
		this.velocity = {
			x: 0,
			y: settings.racket.v
		};
		this.position = {
			top: (boundaries.racket.h) / 2,
			left: left
		};
	};
	
	server = {
		
		init: function init() {
			
			var that, conf, express, host;
					
			that = this;
			
			conf = require('./conf');						
			express = require('express');
			host = express.createServer();
			host.listen(conf.port);

			this.io = require('socket.io');
			this.io = this.io.listen(host);
			
			this.io.set('log level', 1);
			this.io.set('transports', ['websocket']);
			
			game.run();
			
			this.io.sockets.on('connection', function (socket) {

				var id, player;
								
				if (playersCounter === 0) {
					game.addBall();
				}

				id = socket.id;
				player = game.addPlayer(id);
				socket.json.send(player);
				
				socket.on('message', function (msg) {
					player.moving = msg.moving;
					player.velocity.y = Math.abs(player.velocity.y) * msg.velocity.y;
				});

				socket.on('disconnect', function () {
					
					game.removePlayer(id);
					socket.broadcast.json.send(player);
					
					playersCounter = playersCounter - 1;
					if (playersCounter === 0) {
						data = {};
					}
				});
			});			
		}
	};
	
	game = {
		
		run: function run() {
			
			var that = this;
			
			this.lastFrameTime = new Date().getTime();
			this.idealTimeFrame = 1000 / settings.cycle;
			this.leftover = 0;			
			
			setInterval(function () { that.tick(); }, this.idealTimeFrame);
		},
		
		addBall: function addBall() {
			var id = 'ball-' + Math.random();
			data[id] = new Ball(id);
		},
		
		resetBall: function resetBall(ball, side) {
			
			var isLeft, pos, vel;
			
			isLeft = (side === -wBall);
			pos = ball.position;
			vel = ball.velocity;
			
			pos.top = (boundaries.ball.h) / 2;
			pos.left = (boundaries.ball.w) / 2;
			
			vel.y = settings.ball.v * (Math.round(Math.random()) * 2 - 1);
			vel.x = -settings.ball.v;
			if (isLeft) {
				vel.x = -vel.x;
			}
		},
		
		addPlayer: function addPlayer(id) {
			
			var offset;

			if (rightPlayers < leftPlayers) {
				offset = boundaries.racket.w;
				rightPlayers = rightPlayers + 1;
			} else {
				offset = 0;
				leftPlayers = leftPlayers + 1;
			}
			
			playersCounter = playersCounter + 1;
			data[id] = new Player(id, offset);
			return data[id];
		},
		
		removePlayer: function removePlayer(id) {
			
			var player = data[id];
						
			if (player.position.left === 0) {
				leftPlayers  = leftPlayers - 1;
			} else {
				rightPlayers = rightPlayers - 1;
			}

			delete data[id];
		},
		
		tick: function tick() {
			
			var thisFrameTime, timeSinceDoLogic, frameToProcess, i;

			thisFrameTime = new Date().getTime();
			timeSinceDoLogic = (thisFrameTime - this.lastFrameTime) + this.leftover;
			i = frameToProcess = Math.floor(timeSinceDoLogic / this.idealTimeFrame);

			if (i > 0) {
				while (i--) {
					this.update();
				}
				server.io.sockets.json.send(data);
			}

			this.leftover = timeSinceDoLogic - (frameToProcess * this.idealTimeFrame);
		    this.lastFrameTime = thisFrameTime;
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
								this.resetBall(obj, newLeft);
								this.score(newLeft);
							}
						}
					}
				}
			}
		},
		
		collision: function collision(obj, side) {
			
			var isLeft, offsetLeft, objTop, objSpace, id, racket, racketLeft, racketTop;
									
			isLeft = (side === wRacket);
			if ((isLeft && leftPlayers === 0) || (!isLeft && rightPlayers === 0)) {
				
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
			
	server.init();
	
}());