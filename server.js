
// DEPENDENCIES
var express = require('express');
var io = require('socket.io');

(function pongserver() {
	
	var server, socket, players, plRight, plLeft, interval;

	server = express.createServer();
	server.listen(50000);

	socket = io.listen(server);
	players = {};
	plRight = 0;
	plLeft = 0;

	socket.on('connection', function (client) {
		
		console.log('Player ' + client.sessionId + ' has connected');	

		var obj, positionLeft;
		if (plRight < plLeft) {
			positionLeft = 785;
			plRight = plRight + 1;
		} else {
			positionLeft = 0;
			plLeft = plLeft + 1;
		}

		obj = { id: client.sessionId, moving: false, direction: -10, position: { top: 215, left: positionLeft } };

		client.send(obj);
		players[client.sessionId] = obj;

		client.on('message', function (data) { 
			
			var player 					= players[client.sessionId];
				player.moving 			= data.moving;
				player.direction 		= data.direction;
				player.position.top 	= data.position.top;				
		});

		client.on('disconnect', function () {
			
			console.log('Player ' + client.sessionId + ' has disconnected');

			if (obj.position.left === 0) {
				plLeft = plLeft - 1
			} else {
				plRight = plRight - 1
			}

			client.broadcast(obj);
			delete players[client.sessionId];
		});
		
	});

	interval = setInterval(function () {
		for (obj in players) {
			var player = players[obj];			
			if (player.moving === true) {
				player.position.top = player.position.top + player.direction;
			}
		}
		socket.broadcast(players);
	}, 25);
	
}());