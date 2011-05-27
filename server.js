
require.paths.push('/usr/local/lib/node_modules');

(function PongServer() {
		
	var options, express, server, io, socket, data, Racket, Ball, nBals, nRigt, nLeft, update;
	
	options = {
		field: { w: 1005, h: 565, },
		racket: { w: 15, h: 65, v: 5},
		ball: { w: 15, h: 15, v: 5 }
	}
	
	express = require('express');
	server = express.createServer();
	server.listen(55555);
	
	io = require('socket.io');
	socket = io.listen(server);
	
	data = {};
	
	Racket = function Racket (id) {
			
		var field, racket, offsetLeft;
		
		field = options.field;
		racket = options.racket;
		
		if (nRigt < nLeft) {
			offsetLeft = field.w - racket.w;
			nRigt = nRigt + 1;
		} else {
			offsetLeft = 0;
			nLeft = nLeft + 1;
		}
			
		this.id = id,
		this.type = 'racket',
		this.moving = false,
		this.velocity = {
			x: 0,
			y: options.racket.v
		},
		this.position = { 
			top: (field.h - racket.h)/2, 
			left: offsetLeft
		}
	};
	
	Ball = function Ball (id) {
		
		var field, ball;
		
		field = options.field;
		ball = options.ball;
				
		nBals = nBals + 1;
		
		this.id = id,
		this.type = 'ball',
		this.moving = true,
		this.velocity = {
			x: ball.v * (Math.round(Math.random())*2 - 1),
			y: ball.v * (Math.round(Math.random())*2 - 1)
		},
		this.position = { 
			top: (field.h - ball.h)/2, 
			left: (field.w - ball.w)/2
		}		
	}
	
	nBals = 0;
	nRigt = 0;
	nLeft = 0;
		
	socket.on('connection', function (client) {
		
		console.log('Player ' + client.sessionId + ' has connected');	

		var id, ball, racket;
		
		if (nBals === 0) {
			id = 'ball-' + nBals;
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
				nLeft = nLeft - 1
			} else {
				nRigt = nRigt - 1
			}

			client.broadcast(racket);
			delete data[racket.id];
			
			console.log('Player ' + client.sessionId + ' has disconnected');
		});
		
	});
	
	update = setInterval(function () {
		
		var field, racket, ball, obj, velocity, position, newTop, newLeft;
		
		field = options.field;
		racket = options.racket;
		ball = options.ball;
		
		for (id in data) {
			
			obj = data[id];		
			if (obj.moving === true) {
				
				velocity = obj.velocity;
				position = obj.position;
				
				if (obj.type === 'racket') {
								
					newTop = position.top + velocity.y;
					newTop = Math.max(0, newTop);
					newTop = Math.min(newTop, (field.h - racket.h));
					position.top = newTop;
				
				} else {
					
					newTop = position.top + velocity.y;					
					newTop = Math.max(0, newTop);
					newTop = Math.min(newTop, field.h - ball.h);
					position.top = newTop;					
					if (newTop === 0 || newTop === field.h - ball.h) {
						velocity.y = -velocity.y;
					}

					newLeft = position.left + velocity.x;
					newLeft = Math.max(ball.w, newLeft);
					newLeft = Math.min(newLeft, field.w - ball.w);
					position.left = newLeft;
					if (newLeft === ball.w || newLeft === field.w - ball.w) {
						velocity.x = -velocity.x;
					}
				}
			}
		}
		socket.broadcast(data);
		
	}, 25);
	
	// TODO: Hit test = racket.top < ball.top + 15 && ball.top < racket.top + 65;
	
}());