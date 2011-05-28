
require.paths.push('/usr/local/lib/node_modules');

(function PongServer() {
	
	"use strict";
	
	var express, server, io, socket, pField, pRacket, pBall, nBalls, nRight, nLeft, data, Racket, Ball, update;
	
	express = require('express');
	server = express.createServer();
	server.listen(55555);
	
	io = require('socket.io');
	socket = io.listen(server);
		
	pField = { w: 1005, h: 565 };
	pRacket = { w: 15, h: 65, v: 5 };
	pBall = { w: 15, h: 15, v: 5 };
		
	nBalls = 0;
	nRight = 0;
	nLeft = 0;
	
	data = {};
	
	Racket = function Racket(id) {
		
		var offsetLeft;
				
		if (nRight < nLeft) {
			offsetLeft = pField.w - pRacket.w;
			nRight = nRight + 1;
		} else {
			offsetLeft = 0;
			nLeft = nLeft + 1;
		}
			
		this.id = id;
		this.type = 'racket';
		this.moving = false;
		this.velocity = {
			x: 0,
			y: pRacket.v
		};
		this.position = {
			top: (pField.h - pRacket.h) / 2,
			left: offsetLeft
		};
	};
	
	Ball = function Ball(id) {
				
		nBalls = nBalls + 1;
		
		this.id = id;
		this.type = 'ball';
		this.moving = true;
		this.velocity = {
			x: pBall.v * (Math.round(Math.random()) * 2 - 1),
			y: pBall.v * (Math.round(Math.random()) * 2 - 1)
		};
		this.position = {
			top: (pField.h - pBall.h) / 2,
			left: (pField.w - pBall.w) / 2
		};
		this.hit = 0;
	};
		
	socket.on('connection', function (client) {
		
		console.log('Player ' + client.sessionId + ' has connected');

		var id, ball, racket;
		
		if (nBalls === 0) {
			id = 'ball-' + nBalls;
			ball = new Ball(id);
			data[id] = ball;
		}
		
		id = client.sessionId;
		racket = new Racket(id); 

		client.send(racket);
		data[id] = racket;
		
		client.on('message', function (msg) {
			data[id].moving = msg.moving;
			data[id].velocity.y = msg.velocity.y;
		});

		client.on('disconnect', function () {
			
			if (racket.position.left === 0) {
				nLeft = nLeft - 1;
			} else {
				nRight = nRight - 1;
			}

			client.broadcast(racket);
			delete data[racket.id];
			
			console.log('Player ' + client.sessionId + ' has disconnected');
		});
	});
	
	update = {
		
		interval: null,
			
		init: function init() {
			
			var that = this;
			
			this.interval = setInterval(function () {
				var id, obj;
				for (id in data) {
					if (data.hasOwnProperty(id)) {
						obj = data[id];
						if (obj.moving === true) {
							that.reposition(obj);
						}
					}
				}
				socket.broadcast(data);
			}, 25);
		},
		
		reposition: function reposition(obj) {
						
			var isBall, limitHeight, limitWidth, pos, vel, newTop, newLeft;
			
			isBall = (obj.type === 'ball');
			
			limitHeight = pField.h - pRacket.h;
			if (isBall) {
				limitHeight = pField.h - pBall.h;
			}
			
			pos = obj.position;
			vel = obj.velocity;
			
			newTop = pos.top + vel.y;
			newTop = Math.max(0, newTop);
			newTop = Math.min(newTop, limitHeight);
			pos.top = newTop;
			
			if (isBall) {
				
				if (newTop === 0 || newTop === limitHeight) {
					vel.y = -vel.y;
				}
				
				limitWidth = pField.w - pRacket.w;
				
				if (pos.left <= pRacket.w || pos.left >= limitWidth) {
					newLeft = pos.left + vel.x;
					newLeft = Math.max(-pBall.w, newLeft);
					newLeft = Math.min(newLeft, pField.w);
				} else {
					newLeft = pos.left + vel.x;
					newLeft = Math.max(pRacket.w, newLeft);
					newLeft = Math.min(newLeft, limitWidth);
				}
				
				pos.left = newLeft;
				
				if (newLeft === pRacket.w || newLeft === limitWidth) {
					this.hitCheck(obj, newLeft);
				} else if (newLeft === -pBall.w || newLeft === pField.w) {
					this.score(obj, newLeft);
				}
			}
		},
		
		hitCheck: function hitCheck(obj, side) {
			
			var isLeft, offsetLeft, objTop, objSpace, id, racketLeft, racketTop;
						
			isLeft = (side === pRacket.w);
			if ((isLeft && nLeft === 0) || (!isLeft && nRight === 0)) {
				obj.velocity.x = -obj.velocity.x;
				this.velocityCheck(obj);
			} else {
				
				offsetLeft = pField.w - pRacket.w;
				objTop = obj.position.top;
				objSpace = objTop + pBall.h;
						
				for (id in data) {
					if (data.hasOwnProperty(id) && data[id].type === 'racket') {
						
						racketLeft = data[id].position.left;
						if ((isLeft && racketLeft === 0) || (!isLeft && racketLeft === offsetLeft)) {
							
							racketTop = data[id].position.top;
							if (racketTop < objSpace && objTop < racketTop + pRacket.h) {
								obj.velocity.x = -obj.velocity.x;
								this.velocityCheck(obj);
								break;
							}
						}
					}
				}
			}	
		},
		
		velocityCheck: function velocityCheck(obj) {
			
			var value, vel;			
			
			vel = obj.velocity;
			if (obj.hit === 5) {
				for (value in vel) {
					if (vel.hasOwnProperty(value)) {
						if (vel[value] < 0) {
							vel[value] = vel[value] - 1;
						} else {
							vel[value] = vel[value] + 1;
						}						
					}
				}
				obj.hit = 0;
			} else {
				obj.hit = obj.hit + 1;
			}
		},
		
		score: function score(obj, side) {
			
			var isLeft, pos, vel;
			
			isLeft = (side === -pBall.w);
			pos = obj.position;
			vel = obj.velocity;
			
			pos.top = (pField.h - pBall.h) / 2;
			pos.left = (pField.w - pBall.w) / 2;
			
			vel.y = pBall.v * (Math.round(Math.random()) * 2 - 1);
			vel.x = -pBall.v;
			if (isLeft) {
				vel.x = pBall.v;
			}
			
			// TODO: add a point
		}
	};
	
	update.init();
	
}());