
// DEPENDENCIES
var express, io;
express = require('express');
io 		= require('socket.io');

(function PongServer() {
	
	var server, socket, gamers, nRight, nLeft, interval;

	server = express.createServer();
	server.listen(50000);

	socket = io.listen(server);
	gamers = {};
	nRight = 0;
	nLeft = 0;

	socket.on('connection', function (client) {
		
		console.log('Player ' + client.sessionId + ' has connected');	

		var posLeft, gamer;
		
		if (nRight < nLeft) {
			posLeft = 785;
			nRight = nRight + 1;
		} else {
			posLeft = 0;
			nLeft = nLeft + 1;
		}

		gamer = { 
			id: client.sessionId,
			moving: false,
			direction: 5,
			position: { 
				top: 215, 
				left: posLeft
			}
		};

		client.send(gamer);
		gamers[gamer.id] = gamer;

		client.on('message', function (data) {
			
			gamer.moving = data.moving;
			gamer.direction = data.direction;
			gamers[gamer.id] = gamer;		
		});

		client.on('disconnect', function () {
			
			if (gamer.position.left === 0) {
				nLeft = nLeft - 1
			} else {
				nRight = nRight - 1
			}

			client.broadcast(gamer);
			delete gamers[gamer.id];
			
			console.log('Player ' + client.sessionId + ' has disconnected');
		});
		
	});

	interval = setInterval(function () {
		
		var gamer, newTop;
		for (obj in gamers) {
			
			gamer = gamers[obj];		
			if (gamer.moving === true) {
				
				newTop = gamer.position.top + gamer.direction;
				if (newTop < 0) {
					newTop = 0;
				} else if (newTop > 430) {
					newTop = 430;
				}
				gamer.position.top = newTop;				
			}
		}
		socket.broadcast(gamers);
		
	}, 25);
	
}());