
(function pongclient() {
	
	var socket = new io.Socket('spellbook.local', {'port':'50000'});
	socket.connect();
	
	socket.on('connect', function () {
		console.log('Connected to node socket');
	}); 

	socket.on('message', function (data) {

		var player, selector, $racket;

		if (data.hasOwnProperty('id')) {

			selector = '#ID-' + data.id;
			if ($(selector).length !== 0) {	
				
				$(selector).remove();
			
			} else {
				
				$('#field').append('<div id="ID-' + data.id + '" class="racket red"></div>');
				
				$racket = $(selector);
				$racket.css({
					'top': data.position.top + 'px',
					'left': data.position.left + 'px'
				});

				$(window).bind('keydown', function(e) {
					var keycode, data;
					keycode = e.keyCode;
					if (keycode === 38 || keycode === 40) {
						e.preventDefault();
						data = {
							moving: true,
							direction: -10,
							position: {
								top: parseInt($racket.position().top, 10)
							}
						};
						
						if (keycode === 40) {
							data.direction = 10;
						}
					
						socket.send(data);
					}					
				}).bind('keyup', function(e) {
					var keycode, data;
					keycode = e.keyCode;
					if (keycode === 38 || keycode === 40) {
						e.preventDefault();
						data = {
							moving: false,
							direction: 10,
							position: {
								top: parseInt($racket.position().top, 10)
							}
						};
						
						if (keycode === 40) {
							data.direction = -10;
						}
						
						socket.send(data);
					}	
				});
			}

		} else {

			for (name in data) {

				player = data[name];
				selector = '#ID-' + player.id;
				if ($(selector).length === 0) {
					$('#field').append('<div id="ID-' + player.id + '" class="racket"></div>');
				}
								
				$(selector).css({
					'top': player.position.top + 'px',
					'left': player.position.left + 'px'
				});
			}
		}			
	});

	socket.on('disconnect', function () {
		console.log('Disconnected from node socket');
	});
	
	
	
}());