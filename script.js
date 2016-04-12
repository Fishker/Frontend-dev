;function Canvas() {
	var _canvas = document.getElementById('canvas-field');							// канвас-поле
	var _context = _canvas.getContext('2d');										// 2д-контекст канваса
	var _colorObjects = document.getElementsByClassName('button-palette');			// все объекты цвета кисти
	var _thicknessObjects = document.getElementsByClassName('button-thickness');	// все объекты толщины кисти
	var _currentColorObject = document.getElementsByClassName('selected-p')[0];		// тек. объект, содержащий цвет кисти
	var _currentThicknessObject = document.getElementsByClassName('selected-t')[0];	// тек. объект, содержащий толщину кисти
	var _storage = localStorage;													// хранилище
	var _X = ((window.innerWidth / 2) - 215);
	// var _date = new Date(); // дата открытия страницы && дата синхронизации
	var GUID; // ~readonly (подобие GUID)

	// генерируем ключ страницы
	(function () {
		function Generage () {
			return Math.floor((1 + Math.random()) * 0x10000)
				.toString(16)
				.substring(1);
		}

		GUID =
			Generage() +
			Generage() + '-' +
			Generage() + '-' +
			Generage() + '-' +
			Generage() + '-' +
			Generage() +
			Generage() +
			Generage();
	})();

	_context.strokeStyle = _currentColorObject.getAttribute('data-color');
	_context.lineWidth = _currentThicknessObject.getAttribute('data-thickness');
	
	// вбиваем обработчик на объекты цвета
	var j;
	var length = _colorObjects.length;
	for (j = 0; j < length; j++) {
		_colorObjects[j].onmousedown = function (e) {
			var target = e.currentTarget;
			if (target.classList.contains('selected-p')) return;
			
			_currentColorObject.classList.remove('selected-p');
			_currentColorObject = target;
			_currentColorObject.classList.add('selected-p');
			_context.strokeStyle = _currentColorObject.getAttribute('data-color');
			
			var thicknessObjectLength = _thicknessObjects.length;
			for (var i = 0; i < thicknessObjectLength; i++) {
				_thicknessObjects[i].style.backgroundColor = _context.strokeStyle;
			}
		};
	}
	// вбиваем обработчик на объекты толщины
	length = _thicknessObjects.length;
	for (j = 0; j < length; j++) {
		_thicknessObjects[j].onmousedown = function (e) {
			var target = e.currentTarget;
			if (target.classList.contains('selected-t')) return;
			
			_currentThicknessObject.classList.remove('selected-t');
			_currentThicknessObject = target;
			_currentThicknessObject.classList.add('selected-t');
			_context.lineWidth = _currentThicknessObject.getAttribute('data-thickness');
		}
	}
	
	// красим объекты толщины
	var thicknessObjectLength = _thicknessObjects.length;
	for (var i = 0; i < thicknessObjectLength; i++) {
		_thicknessObjects[i].style.backgroundColor = _context.strokeStyle;
	}
	
	j = null;
	length = null;
	
	// рисуем
	var PushPaint = function (e) {
		_context.beginPath();
		_context.arc(e.pageX - _X, e.pageY - _canvas.offsetTop, _context.lineWidth, 0, 2 * Math.PI, false);
		_context.closePath();
		_context.stroke();
		_context.fillStyle = _context.strokeStyle;
		_context.fill();
	}
	// начинаем рисовать
	var _isDrawing = false;
	var Drawing = function (e) {
		if (e.button != 0) return;
		_isDrawing = true;
		PushPaint(e);
	}
	// прекращаем рисовать
	var Nodraw = function (e) { _isDrawing = false; }
	// продолжаем рисовать
	var Draw = function (e) {
		if (_isDrawing != true) return;
		PushPaint(e);
	}
	
	_canvas.onmousedown = Drawing;
	_canvas.onmousemove = Draw;
	_canvas.onmouseup = Nodraw;
	document.onmouseup = Nodraw;
	
	// синхронизация
	var Synchronize = function (e) {
		// багованный фокус приходится убирать
		window.onfocus = null;
		window.onblur = Blur;
		// выясняем тип события и ключ страницы
		// var date = new Date(_storage.getItem('date'));
		var tmp = _storage.getItem('apply');
		if (e == null) {
			// _storage.setItem('date', new Date());
			_storage.setItem('apply', GUID);
			tmp = GUID
		} else if (tmp == null || tmp == GUID) return;
		// штука, благодаря которой не синхронизирует при открытии новой вкладки, если перед этим записали в хранилище
		// if (_date > date || date == null || date == undefined) return;
		
		// дальше - если все-таки синхронизация другой страницы или же нажата кнопка синхронизации
		//
		// парсим данные
	    var jsonData = JSON.parse(_storage.getItem('context'));
	    if (jsonData == null || jsonData == undefined) {
	        return;
	    }

		// синхронизируем
		var data = _context.getImageData(0, 0, _canvas.clientWidth, _canvas.clientHeight);
		var length = jsonData.length;
		for (var j = 0; j < length; j++) {
			var elem = jsonData[j];
			if (elem != 0) data.data[j] = elem;
		}
		
		// обновляем данные канваса и хранилища
		_context.putImageData(data, 0, 0);
		_storage.setItem('context', JSON.stringify(Array.from(_context.getImageData(0, 0, _canvas.clientWidth, _canvas.clientHeight).data)));
	}
	var Blur = function (e) {
		window.onfocus = Synchronize;
	}
	
	// чистим канвас
	this.ClearCanvas = function () {
		_context.clearRect(0, 0, _canvas.width, _canvas.height);
	}
	// сохраняем данные
	this.SaveCanvas = function () {
	    var data = _context.getImageData(0, 0, _canvas.clientWidth, _canvas.clientHeight);
	    var dataWrite = Array.from(data.data);
	    _storage.setItem('context', JSON.stringify(dataWrite));
	    Synchronize(null);
	}
	// заканчиваем работу
	var Finish = function (e) {
	    _storage.clear();
		_context = null;
		_context = null;
	}
	
	// window.addEventListener('storage', function () {
	// 		alert('Локальное хранилище не работает без веб-сервера.');
	// }, false);
	// пришлось сделать почти "аналог" событию onstorage
	window.onblur = Blur;
	window.onfocus = null;
	window.onload = Synchronize;
	window.onunload = Finish;
}