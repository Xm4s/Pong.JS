
(function PongServer() {
	
	console.log(Math.random());
	
	var express, server, io, socket, rackets, Racket, balls, Ball, nBals, nRigt, nLeft, update;
	
	express = require('express');
	server = express.createServer();
	server.listen(55555);
	
	io = require('socket.io');
	socket = io.listen(server);

	rackets = {};
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
	
	balls = {};
	Ball = function Ball (id) {
		
		var x, y;
		
		nBals = nBals + 1;
		
		this.id = id,
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

		var id, racket;
		
		id = client.sessionId;
		racket = new Racket(id); 

		client.send(racket);
		rackets[id] = racket;

		client.on('message', function (data) {
			
			console.log(data);
			
			rackets[id].moving = data.moving;
			rackets[id].velocity.y = data.velocity.y;
		});

		client.on('disconnect', function () {
			
			if (racket.position.left === 0) {
				nLeft = nLeft - 1
			} else {
				nRigt = nRigt - 1
			}

			client.broadcast(racket);
			delete rackets[racket.id];
			
			console.log('Player ' + client.sessionId + ' has disconnected');
		});
		
	});
	
	update = setInterval(function () {
		
		var racket, newTop;
		for (obj in rackets) {
			
			racket = rackets[obj];		
			if (racket.moving === true) {
								
				newTop = racket.position.top + racket.velocity.y;
				newTop = Math.max(0, newTop);
				newTop = Math.min(newTop, 440);
				
				racket.position.top = newTop;				
			}
		}
		socket.broadcast(rackets);
		
	}, 25);
	
}());