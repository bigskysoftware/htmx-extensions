describe('attributes extension', function () {
	beforeEach(function () {
		this.server = makeServer();
		clearWorkArea();
	});
	afterEach(function () {
		this.server.restore();
		clearWorkArea();
	});

	function logElement(element) {
		console.log('Element:', element.outerHTML);
	}

	function waitForSwap(element, callback) {
		var swapEvent = htmx.on(element, 'htmx:afterSwap', function () {
			htmx.off(element, 'htmx:afterSwap', swapEvent);
			setTimeout(callback, 0); // Ensure this runs after htmx has finished processing
		});
	}

	it('swaps attributes properly while preserving id', function (done) {
		this.server.respondWith(
			'GET',
			'/test',
			'<div id="new-target" class="new" hx-vals=\'{"foo": "bar"}\'>New Content</div>'
		);
		var div = make(
			`<div hx-ext="attributes">
				<div id="target" class="original" hx-vals=\'{"baz": "qux"}\'>Original Content</div>
				<button hx-get="/test" hx-target="#target" hx-swap="attributes">Click Me!</button>
			</div>`
		);
		var button = div.querySelector('button');

		waitForSwap(target, function () {
			var target = div.querySelector('#target');
			// logElement(target);
			should.equal(target.id, 'target');
			should.equal(target.getAttribute('class'), 'new');
			should.equal(target.getAttribute('hx-vals'), '{"foo": "bar"}');
			should.equal(target.innerHTML, 'Original Content');
			done();
		});

		button.click();
		this.server.respond();
	});

	it('supports out-of-band swaps', function (done) {
		this.server.respondWith(
			'GET',
			'/test',
			'<div id="oob-target" hx-swap-oob="attributes" class="new" hx-vals=\'{"oob": true}\'>New Content</div>'
		);
		var div = make(
			`<div hx-ext="attributes">
				<div id="oob-target" class="original">Original Content</div>
				<button hx-get="/test">Click Me!</button>
			</div>`
		);
		var button = div.querySelector('button');

		var oobSwapEvent = htmx.on('htmx:oobAfterSwap', function () {
			htmx.off('htmx:oobAfterSwap', oobSwapEvent);
			setTimeout(function () {
				var target = div.querySelector('#oob-target');
				// logElement(target);
				should.equal(target.id, 'oob-target');
				should.equal(target.getAttribute('class'), 'new');
				should.equal(target.getAttribute('hx-vals'), '{"oob": true}');
				should.equal(target.innerHTML, 'Original Content');
				done();
			}, 0);
		});

		button.click();
		this.server.respond();
	});

	it('does not copy hx-swap-oob attribute to target', function (done) {
		this.server.respondWith(
			'GET',
			'/test',
			'<div id="target" hx-swap-oob="attributes" class="new">New Content</div>'
		);
		var div = make(
			`<div hx-ext="attributes">
				<div id="target">Original Content</div>
				<button hx-get="/test">Click Me!</button>
			</div>`
		);
		var button = div.querySelector('button');

		var oobSwapEvent = htmx.on('htmx:oobAfterSwap', function () {
			htmx.off('htmx:oobAfterSwap', oobSwapEvent);
			setTimeout(function () {
				var target = div.querySelector('#target');
				// logElement(target);
				should.equal(target.getAttribute('hx-swap-oob'), null);
				should.equal(target.getAttribute('class'), 'new');
				should.equal(target.innerHTML, 'Original Content');
				done();
			}, 0);
		});

		button.click();
		this.server.respond();
	});

	it('does not interfere with normal hx-swap behavior', function (done) {
		this.server.respondWith('GET', '/test', 'New Content');
		var div = make(
			`<div hx-ext="attributes">
				<div id="target">Original Content</div>
				<button hx-get="/test" hx-target="#target" hx-swap="innerHTML">Click Me!</button>
			</div>`
		);
		var button = div.querySelector('button');

		waitForSwap(target, function () {
			var target = div.querySelector('#target');
			// logElement(target);
			should.equal(target.innerHTML, 'New Content');
			done();
		});

		button.click();
		this.server.respond();
	});

	it('does not interfere with normal hx-swap-oob behavior', function (done) {
		this.server.respondWith(
			'POST',
			'/test',
			'<div id="oob1" hx-swap-oob="true">OOB Content</div><div id="oob2" hx-swap-oob="true">Another OOB</div>New Content'
		);
		var div = make(
			`<div hx-ext="attributes">
				<div id="target">Original Content</div>
				<div id="oob1">Original OOB 1</div>
				<div id="oob2">Original OOB 2</div>
				<button hx-post="/test" hx-target="#target" hx-swap="innerHTML">Click Me!</button>
			</div>`
		);
		var button = div.querySelector('button');

		var oobCount = 0;
		var oobSwapEvent = htmx.on('htmx:oobAfterSwap', function () {
			oobCount++;
			if (oobCount === 2) {
				htmx.off('htmx:oobAfterSwap', oobSwapEvent);
				setTimeout(function () {
					var target = div.querySelector('#target');
					var oob1 = div.querySelector('#oob1');
					var oob2 = div.querySelector('#oob2');

					// logElement(target);
					// logElement(oob1);
					// logElement(oob2);
					should.equal(target.innerHTML, 'New Content');
					should.equal(oob1.innerHTML, 'OOB Content');
					should.equal(oob2.innerHTML, 'Another OOB');
					done();
				}, 0);
			}
		});

		button.click();
		this.server.respond();
	});

	it('allows mixing of attributes swap with normal swap', function (done) {
		this.server.respondWith(
			'GET',
			'/test',
			`New Content<div id="inner" hx-swap-oob="attributes" class="new-class">New Attribute</div><div id="oob" hx-swap-oob="true">OOB Content</div>`
		);
		var div = make(
			`<div hx-ext="attributes">
				<div id="target">Original Content</div>
				<div id="inner" class="original">Original Inner</div>
				<div id="oob">Original OOB</div>
				<button hx-get="/test" hx-target="#target" hx-swap="innerHTML">Click Me!</button>
			</div>`
		);
		var button = div.querySelector('button');

		var swapCount = 0;
		function checkDone() {
			swapCount++;
			if (swapCount === 3) {
				setTimeout(function () {
					var target = div.querySelector('#target');
					var inner = div.querySelector('#inner');
					var oob = div.querySelector('#oob');

					// logElement(target);
					// logElement(inner);
					// logElement(oob);
					should.equal(target.innerHTML, 'New Content');
					should.equal(inner.innerHTML, 'Original Inner');
					should.equal(inner.getAttribute('class'), 'new-class');
					should.equal(oob.innerHTML, 'OOB Content');
					done();
				}, 0);
			}
		}

		waitForSwap(target, checkDone);
		var oobSwapEvent = htmx.on('htmx:oobAfterSwap', function () {
			checkDone();
			if (swapCount === 2) {
				htmx.off('htmx:oobAfterSwap', oobSwapEvent);
			}
		});

		button.click();
		this.server.respond();
	});
});
