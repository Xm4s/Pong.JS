
(function PongClient() {
	
	var socket, field, player;
		
	socket = {
						
		init: function init() {
			
			var id, elem;
			
			this['io'] = new io.Socket('spellbook.local', {'port':'55555'});
			this.io.connect();
		
			this.io.on('connect', function () {
				// console.log('Connected to node socket');		
			});
		
			this.io.on('message', function (data) {
							
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
		
			this.io.on('disconnect', function () {
				// console.log('Disconnected from node socket');
			});
		}	
	}
	
	field = document.getElementById('field');
	
	players = {
		
		me: {
							
			init: function init(data) {
								
				var id = 'ID-' + data.id;
				$(field).append('<div id="' + id + '" class="racket red"></div>');
							
				players.update(data);
				
				this['elem'] = document.getElementById(id);
				this['isMoving'] = false;
												
				$(window).bind('keydown', this.onMove).bind('keyup', this.onMove);
			},
			
			onMove: function onMove(e) {
									
				var that, keycode, type, data;
				
				that = players.me;
				keycode = e.keyCode;
				type = e.type;
									
				if (keycode === 38 || keycode == 40) {		
					e.preventDefault();
				
					if (type === 'keydown' && that.isMoving === false) {
					
						that.isMoving = true;
						data = {
							moving: that.isMoving,
							velocity: {
								y: 5
							}
						}
						if (keycode === 38) {
							data.velocity.y = -5
						}
						socket.io.send(data);
					
					} else if (type === 'keyup' && that.isMoving === true) {
					
						that.isMoving = false;
						data = {
							moving: that.isMoving,
							velocity: {
								y: -5
							}
						}
						if (keycode === 38) {
							data.velocity.y = 5;
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
			
			$(document.getElementById('ID-' + data.id)).css({
				'top': data.position.top + 'px',
				'left': data.position.left + 'px'
			});
		}
	};
	
	$(document).ready(function () { socket.init(); });
		
}());