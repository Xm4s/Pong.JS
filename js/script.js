
(function PongClient() {
	
	var socket, field, player;
		
	socket = {
		
		io: null,
		
		init: function init() {
			
			socket.io = new io.Socket('spellbook.local', {'port':'50000'});
			socket.io.connect();
			
			socket.io.on('connect', function () {
				console.log('Connected to node socket');		
			});
			
			socket.io.on('message', function (data) {
				
				var id, elem
				
				if (data.hasOwnProperty('id')) {
					
					elem = document.getElementById('ID-' + data.id);
					if (elem === null) {
						players.me.init(data);
					} else {
						players.others.deInit(elem);
					}
					
				} else {
					
					for (obj in data) {
						
						id = 'ID-' + data[obj].id;
						elem = document.getElementById(id);
						if (elem === null) {
							players.others.init(id);
						}
						players.update(data[obj]);
					}					
				}
				
			});
			
			socket.io.on('disconnect', function () {
				console.log('Disconnected from node socket');
			});
		}
	}
	
	field = document.getElementById('field');
	
	players = {
		
		me: {
			
			elem: null,
			moving: false,
			
			init: function init(data) {
				
				var id, elem;
				
				id = 'ID-' + data.id;
				$(field).append('<div id="' + id + '" class="racket red"></div>');
								
				players.update(data);
				this.elem = document.getElementById(id);
								
				$(window).bind('keydown', this.onMove).bind('keyup', this.onMove);
			},
			
			onMove: function onMove(e) {
				
				var that, type, keycode, data;
				
				that = players.me;
				type = e.type;
				keycode = e.keyCode;
				
				
				if (keycode === 38 || keycode == 40) {		
					e.preventDefault();
					
					if (type === 'keydown' && that.moving === false) {
						
						that.moving = true;
						data = {
							moving: that.moving,
							direction: 5,
						}
						
						if (keycode === 38) {
							data.direction = -5
						}
						socket.io.send(data);
						
					} else if (type === 'keyup' && that.moving === true) {
						
						that.moving = false;
						data = {
							moving: that.moving,
							direction: -5,
						}
						
						if (keycode === 38) {
							data.direction = 5;
						}
						
						socket.io.send(data);
					}
				}
			}
		},
		
		others: {
			
			init: function init(id) {
				$(field).append('<div id="' + id + '" class="racket"></div>');
			},
			
			deInit: function deInit(elem) {
				$(elem).remove();
			}
		},
		
		update: function update(data) {
						
			var elem = document.getElementById('ID-' + data.id);
			$(elem).css({
				'top': data.position.top + 'px',
				'left': data.position.left + 'px'
			});
		}
	}
	
	$(document).ready(function () { socket.init(); });
		
}());