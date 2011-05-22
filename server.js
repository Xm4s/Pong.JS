
(function PongServer() {
		
	var express, server, io, socket, data, Racket, Ball, nBals, nRigt, nLeft, update;
	
	express = require('express');
	server = express.createServer();
	server.listen(55555);
	
	io = require('socket.io');
	socket = io.listen(server);
	
	data = {};
	
	Racket = function Racket (id) {
			
		var offsetLeft;
		
		if (nRigt < nLeft) {
			offsetLeft = 790;
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
			y: 5
		},
		this.position = { 
			top: 220, 
			left: offsetLeft
		}
	};
	
	Ball = function Ball (id) {
				
		nBals = nBals + 1;
		
		this.id = id,
		this.type = 'ball',
		this.moving = true,
		this.velocity = {
			x: 5 * (Math.round(Math.random())*2 - 1),
			y: 5 * (Math.round(Math.random())*2 - 1)
		},
		this.position = { 
			top: 245, 
			left: 395
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
		
		var obj, velocity, position, newTop, newLeft;
		for (id in data) {
			
			obj = data[id];		
			if (obj.moving === true) {
				
				velocity = obj.velocity;
				position = obj.position;
				
				if (obj.type === 'racket') {
								
					newTop = position.top + velocity.y;
					newTop = Math.max(0, newTop);
					newTop = Math.min(newTop, 440);
					position.top = newTop;
				
				} else {
					
					newTop = position.top + velocity.y;					
					newTop = Math.max(0, newTop);
					newTop = Math.min(newTop, 490);
					position.top = newTop;					
					if (newTop === 0 || newTop === 490) {
						velocity.y = -velocity.y;
					}

					newLeft = position.left + velocity.x;
					newLeft = Math.max(15, newLeft);
					newLeft = Math.min(newLeft, 790);
					position.left = newLeft;
					if (newLeft === 15 || newLeft === 790) {
						velocity.x = -velocity.x;
					}
				}
			}
		}
		socket.broadcast(data);
		
	}, 25);
	
	// TODO: Hit test = racket.top < ball.top + 15 && ball.top < racket.top + 65;
	
}());