
(function PongClient() {
	
	var socket, field, me, others, update;
		
	socket = {
						
		init: function init() {
						
			this['io'] = new io.Socket('spellbook.local', {'port':'55555'});
			this.io.connect();
		
			this.io.on('connect', function () {
				// console.log('Connected to node socket');		
			});
		
			this.io.on('message', function (data) {
				
				var elem;
							
				if (data.hasOwnProperty('id')) {
				
					elem = document.getElementById('ID-' + data.id);
					if (elem === null) {
						me.init(data);
					} else {
						others.deInit(elem);
					}
				
				} else {
					
					for (obj in data) {
						elem = document.getElementById('ID-' + data[obj].id);
						if (elem === null) {
							others.init(data[obj]);
						}
						update(data[obj]);
					}					
				}
			});
		
			this.io.on('disconnect', function () {
				// console.log('Disconnected from node socket');
			});
		}	
	}
	
	field = document.getElementById('field');
	
	me = {
		
		init: function init(data) {
								
			var id = 'ID-' + data.id;
			$(field).append('<div id="' + id + '" class="racket red"></div>');
			
			update(data);
			
			this['elem'] = document.getElementById(id);
			this['isMoving'] = false;
											
			$(window).bind('keydown', this.onMove).bind('keyup', this.onMove);
		},
		
		onMove: function onMove(e) {
									
			var that, keycode, type, data;
			
			that = me;
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
	}
		
	others = {
		
		init: function init(data) {
			$(field).append('<div id="ID-' + data.id + '" class="' + data.type + '"></div>');
		},
		
		deInit: function deInit(elem) {
			$(elem).remove();
		}
	}
		
	update = function update(data) {
		
		$(document.getElementById('ID-' + data.id)).css({
			'top': data.position.top + 'px',
			'left': data.position.left + 'px'
		});
	}
	
	$(document).ready(function () { socket.init(); });
		
}());