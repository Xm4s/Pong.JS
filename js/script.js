
(function PongClient() {
	
	"use strict";
	
	var socket, field, allElem, me, others, update;
		
	socket = {
						
		init: function init() {
						
			this.io = new io.Socket('spellbook.local', {'port': '55555'});
			this.io.connect();
		
			this.io.on('connect', function () {
				// console.log('Connected to node socket');		
			});
		
			this.io.on('message', function (data) {
				
				var id, obj;						
				if (data.hasOwnProperty('id')) {
					
					id = 'ID-' + data.id;					
					if (!allElem.hasOwnProperty(id)) {
						me.init(data);
					} else {
						others.deInit(id);
					}
				
				} else {
					
					for (obj in data) {
						if (data.hasOwnProperty(obj)) {
							if (!allElem.hasOwnProperty('ID-' + data[obj].id)) {
								others.init(data[obj]);
							}
							update(data[obj]);
						}
					}					
				}
			});
		
			this.io.on('disconnect', function () {
				// console.log('Disconnected from node socket');
			});
		}	
	};
	
	field = document.getElementById('field');
	
	allElem = {};
	
	me = {
		
		init: function init(data) {
						
			var id = 'ID-' + data.id;
			
			$('.me').remove();
			$(field).append('<div id="' + id + '" class="racket me"></div>');
			allElem[id] = document.getElementById(id);
			
			update(data);
						
			this.isMoving = false;								
			$(window).bind('keydown', this.onMove).bind('keyup', this.onMove);
		},
		
		onMove: function onMove(e) {
									
			var that, keycode, type, data;
			
			that = me;
			keycode = e.keyCode;
			type = e.type;
								
			if (keycode === 38 || keycode === 40) {		
				e.preventDefault();
			
				if (type === 'keydown' && that.isMoving === false) {
				
					that.isMoving = true;
					data = {
						moving: that.isMoving,
						velocity: {
							y: 5
						}
					};
					
					if (keycode === 38) {
						data.velocity.y = -5;
					}
					socket.io.send(data);
				
				} else if (type === 'keyup' && that.isMoving === true) {
				
					that.isMoving = false;
					data = {
						moving: that.isMoving,
						velocity: {
							y: -5
						}
					};
					
					if (keycode === 38) {
						data.velocity.y = 5;
					}
					socket.io.send(data);
				}
			}
		}
	};
		
	others = {
		
		init: function init(data) {
			var id = 'ID-' + data.id;
			$(field).append('<div id="' + id + '" class="' + data.type + '"></div>');
			allElem[id] = document.getElementById(id);
		},
		
		deInit: function deInit(id) {
			$(allElem[id]).remove();
			delete allElem[id];
		}
	};
		
	update = function update(data) {
		
		var id = 'ID-' + data.id;
		if (allElem.hasOwnProperty(id)) {
			$(allElem[id]).css({
				'top': data.position.top + 'px',
				'left': data.position.left + 'px'
			});
		}
	};
	
	$(document).ready(function () { socket.init(); });
		
}());