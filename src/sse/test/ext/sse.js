describe('sse extension', function() {
  function mockEventSource() {
    var listeners = {}
    var mockEventSource = {
      _listeners: listeners,
      removeEventListener: function(name, l) {
        listeners[name] = listeners[name].filter(function(elt, idx, arr) {
          if (arr[idx] === l) {
            return false
          }
          return true
        })
      },
      addEventListener: function(message, l) {
        if (!listeners[message]) {
          listeners[message] = []
        }
        listeners[message].push(l)
      },
      sendEvent: function(eventName, data) {
        this.readyState.should.equal(EventSource.OPEN)
        var eventListeners = listeners[eventName]
        if (eventListeners) {
          eventListeners.forEach(function(listener) {
            var event = htmx._('makeEvent')(eventName)
            event.data = data
            listener(event)
          })
        }
      },
      close: function() {
        this.readyState = EventSource.CLOSED
      },
      connect: function(url) {
        this.url = url
        setTimeout(function() {
          if (mockEventSource.failConnections) {
            mockEventSource.readyState = EventSource.CLOSED
            if (typeof mockEventSource.onerror === 'function') {
              mockEventSource.onerror('Simulated EventSource connection failure')
            }
          } else {
            mockEventSource.readyState = EventSource.OPEN
            if (typeof mockEventSource.onopen === 'function') {
              mockEventSource.onopen()
            }
          }
        }, 0)
      },
      simulateConnectionError: function() {
        this.close()
        if (typeof this.onerror === "function") {
          this.onerror()
        }
      },
      /** @type {EventSource.CONNECTING|EventSource.OPEN|EventSource.CLOSED|0|1|2} */
      readyState: EventSource.CONNECTING,
      failConnections: false,
    }
    return mockEventSource
  }

  beforeEach(function() {
    this.server = makeServer()
    this.closeType = ""
    this.clock = sinon.useFakeTimers();
    var test = this
    clearWorkArea()
    htmx.createEventSource = function(url) {
      var eventSource = mockEventSource()
      test.eventSource = eventSource
      eventSource.connect(url)
      return eventSource
    }
  })
  afterEach(function() {
    this.server.restore()
    this.clock.restore();
    clearWorkArea()
  })

  it('correctly subscribes to events', function() {
    make('<div hx-ext="sse" sse-connect="/foo">' +
            '<div sse-connect="/foo">' +
            '<div id="d1" hx-trigger="sse:e1" hx-get="/d1">div1</div>' +
            '</div>' +
            '</div>')
    this.clock.tick(1)

    this.eventSource.url.should.be.equal('/foo');
    this.eventSource._listeners.e1.should.be.lengthOf(1)
  })

  it('correctly behaves when ignored', function() {
    make('<div hx-ext="sse" sse-connect="/foo">' +
            '<div hx-ext="ignore:sse" sse-connect="/foo">' +
            '<div id="d1" hx-trigger="sse:e1" hx-get="/d1">div1</div>' +
            '</div>' +
            '</div>');
    this.clock.tick(1)

    this.eventSource.url.should.be.equal('/foo');
    (this.eventSource._listeners.e1 == undefined).should.be.true
  })

  it('handles basic sse triggering', function() {
    this.server.respondWith('GET', '/d1', 'div1 updated')
    this.server.respondWith('GET', '/d2', 'div2 updated')

    var div = make('<div hx-ext="sse" sse-connect="/foo">' +
            '<div id="d1" hx-trigger="sse:e1" hx-get="/d1">div1</div>' +
            '<div id="d2" hx-trigger="sse:e2" hx-get="/d2">div2</div>' +
            '</div>')
    this.clock.tick(1)

    this.eventSource.sendEvent('e1')
    this.server.respond()
    byId('d1').innerHTML.should.equal('div1 updated')
    byId('d2').innerHTML.should.equal('div2')

    this.eventSource.sendEvent('e2')
    this.server.respond()
    byId('d1').innerHTML.should.equal('div1 updated')
    byId('d2').innerHTML.should.equal('div2 updated')
  })

  it('supports hx-trigger\'s multiple triggers syntax', function() {
    this.server.respondWith('GET', '/d1', 'div1 updated')
    this.server.respondWith('GET', '/d2', 'div2 updated')
    this.server.respondWith('GET', '/d3', 'div3 updated')

    var div = make('<div hx-ext="sse" sse-connect="/foo">' +
      '<div id="d1" hx-trigger="click, whatever from:body, sse:e1" hx-get="/d1">div1</div>' +
      '<div id="d2" hx-trigger="keyup, sse:e2, someTrigger" hx-get="/d2">div2</div>' +
      '<div id="d3" hx-trigger="sse:e3, anotherTrigger" hx-get="/d3">div3</div>' +
      '</div>')
    this.clock.tick(1)

    this.eventSource.sendEvent('e1')
    this.server.respond()
    byId('d1').innerHTML.should.equal('div1 updated')
    byId('d2').innerHTML.should.equal('div2')
    byId('d3').innerHTML.should.equal('div3')

    this.eventSource.sendEvent('e2')
    this.server.respond()
    byId('d1').innerHTML.should.equal('div1 updated')
    byId('d2').innerHTML.should.equal('div2 updated')
    byId('d3').innerHTML.should.equal('div3')

    this.eventSource.sendEvent('e3')
    this.server.respond()
    byId('d1').innerHTML.should.equal('div1 updated')
    byId('d2').innerHTML.should.equal('div2 updated')
    byId('d3').innerHTML.should.equal('div3 updated')
  })

  it('does not trigger events that arent named', function() {
    this.server.respondWith('GET', '/d1', 'div1 updated')

    var div = make('<div hx-ext="sse" sse-connect="/foo">' +
            '<div id="d1" hx-trigger="sse:e1" hx-get="/d1">div1</div>' +
            '</div>')
    this.clock.tick(1)

    this.eventSource.sendEvent('foo')
    this.server.respond()
    byId('d1').innerHTML.should.equal('div1')

    this.eventSource.sendEvent('e2')
    this.server.respond()
    byId('d1').innerHTML.should.equal('div1')

    this.eventSource.sendEvent('e1')
    this.server.respond()
    byId('d1').innerHTML.should.equal('div1 updated')
  })

  it('does not trigger events not on descendents', function() {
    this.server.respondWith('GET', '/d1', 'div1 updated')

    var div = make('<div hx-ext="sse" sse-connect="/foo"></div>' +
            '<div id="d1" hx-trigger="sse:e1" hx-get="/d1">div1</div>')
    this.clock.tick(1)

    this.eventSource.sendEvent('foo')
    this.server.respond()
    byId('d1').innerHTML.should.equal('div1')

    this.eventSource.sendEvent('e2')
    this.server.respond()
    byId('d1').innerHTML.should.equal('div1')

    this.eventSource.sendEvent('e1')
    this.server.respond()
    byId('d1').innerHTML.should.equal('div1')
  })

  it('is closed after removal, hx-trigger', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')
    var div = make('<div hx-get="/test" hx-swap="outerHTML" hx-ext="sse" sse-connect="/foo">' +
            '<div id="d1" hx-trigger="sse:e1" hx-get="/d1">div1</div>' +
            '</div>')
    htmx.on(div, "htmx:sseClose", (evt) => {
      this.closeType = evt.detail.type
    })
    this.clock.tick(1)
    div.click()

    this.server.respond()
    this.closeType.should.equal("nodeReplaced")
    this.eventSource.readyState.should.equal(EventSource.CLOSED)
  })

  it('is closed after removal, hx-swap', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')
    var div = make('<div hx-get="/test" hx-swap="outerHTML" hx-ext="sse" sse-connect="/foo">' +
            '<div id="d1" hx-swap="e1" hx-get="/d1">div1</div>' +
            '</div>')
    htmx.on(div, "htmx:sseClose", (evt) => {
      this.closeType = evt.detail.type
    })
    this.clock.tick(1)
    div.click()

    this.server.respond()
    this.closeType.should.equal("nodeReplaced")
    this.eventSource.readyState.should.equal(EventSource.CLOSED)
  })

  it('is closed after removal with no close and activity, hx-trigger', function() {
    var div = make('<div hx-get="/test" hx-swap="outerHTML" hx-ext="sse" sse-connect="/foo">' +
            '<div id="d1" hx-trigger="sse:e1" hx-get="/d1">div1</div>' +
            '</div>')
    this.clock.tick(1)
    div.parentElement.removeChild(div)

    htmx.on(div, "htmx:sseClose", (evt) => {
      this.closeType = evt.detail.type
    })

    this.eventSource.sendEvent('e1')
    this.closeType.should.equal("nodeMissing")
    this.eventSource.readyState.should.equal(EventSource.CLOSED)
  })

  it('is closed after close message from server', function() {
    var div = make('<div hx-ext="sse" sse-connect="/foo" sse-close="close">' +
            '<div id="d1" sse-swap="e1"></div>' +
            '</div>');
    htmx.on(div, "htmx:sseClose", (evt) => {
      this.closeType = evt.detail.type
    })
    this.clock.tick(1)
    this.eventSource.readyState.should.equal(EventSource.OPEN);
    this.eventSource.sendEvent("close");
    this.closeType.should.equal("message")
    this.eventSource.readyState.should.equal(EventSource.CLOSED);
  })

  it('is closed after close message from server in nested content', function() {
    var div = make('<div hx-ext="sse"><div sse-connect="/foo" sse-close="close">' +
            '<div id="d1" sse-swap="e1"></div>' +
            '</div></div>');

    htmx.on(div, "htmx:sseClose", (evt) => {
      this.closeType = evt.detail.type
    })
    this.clock.tick(1)

    this.eventSource.readyState.should.equal(EventSource.OPEN);
    this.eventSource.sendEvent("close");
    this.closeType.should.equal("message")
    this.eventSource.readyState.should.equal(EventSource.CLOSED);
  })
  it('is closed after close message from server, non-nested', function(){
    var div = make(`<p
        hx-ext="sse"
        sse-connect="/chat"
        sse-close="close"
        id="message"
        sse-swap="message"
      ></p>`
    )
     htmx.on(div, "htmx:sseClose", (evt) => {
      this.closeType = evt.detail.type;
    });
    this.clock.tick(1)
    this.eventSource.readyState.should.equal(EventSource.OPEN);
    this.eventSource.sendEvent('close', '<p></p>')

    this.closeType.should.equal('message')
    this.eventSource.readyState.should.equal(EventSource.CLOSED);
  })

  it('is not listening for events after hx-swap element removed', function() {
    var div = make('<div hx-ext="sse" sse-connect="/foo">' +
        '<div id="d1" hx-swap="innerHTML" sse-swap="e1, e2">div1</div>' +
        '<div id="d2" hx-swap="innerHTML" sse-swap="e2">div1</div>' +
        '</div>')
    this.clock.tick(1)
      this.eventSource._listeners.e1.should.be.lengthOf(1)
      this.eventSource._listeners.e2.should.be.lengthOf(2)
      div.removeChild(byId('d1'))
      this.eventSource.sendEvent('e1', 'Test')
      this.eventSource.sendEvent('e2', 'Test')
      this.eventSource._listeners.e1.should.be.empty
      this.eventSource._listeners.e2.should.be.lengthOf(1)
      div.removeChild(byId('d2'))
      this.eventSource.sendEvent('e1', 'Test')
      this.eventSource.sendEvent('e2', 'Test')
      this.eventSource._listeners.e1.should.be.empty
      this.eventSource._listeners.e2.should.be.empty
  })

  it('is not listening for events after hx-trigger element removed', function() {
    this.server.respondWith('GET', '/test', function(xhr) {
      xhr.respond(200, {})
    })
    var div = make('<div hx-ext="sse" sse-connect="/foo">' +
      '<div id="d1" hx-get="/test" hx-target="this" hx-swap="innerHTML" hx-trigger="sse:e1, sse:e2">div1</div>' +
      '<div id="d2" hx-get="/test" hx-target="this" hx-swap="innerHTML" hx-trigger="sse:e2">div1</div>' +
      '</div>')
    this.clock.tick(1)
    this.eventSource._listeners.e1.should.be.lengthOf(1)
    this.eventSource._listeners.e2.should.be.lengthOf(2)
    div.removeChild(byId('d1'))
    this.eventSource.sendEvent('e1', 'Test')
    this.eventSource.sendEvent('e2', 'Test')
    this.eventSource._listeners.e1.should.be.empty
    this.eventSource._listeners.e2.should.be.lengthOf(1)
    div.removeChild(byId('d2'))
    this.eventSource.sendEvent('e1', 'Test')
    this.eventSource.sendEvent('e2', 'Test')
    this.eventSource._listeners.e1.should.be.empty
    this.eventSource._listeners.e2.should.be.empty
  })

  // sse and hx-trigger handlers are distinct
  it('is closed after removal with no close and activity, sse-swap', function() {
    var div = make('<div hx-get="/test" hx-swap="outerHTML" hx-ext="sse" sse-connect="/foo">' +
            '<div id="d1" sse-swap="e1" hx-get="/d1">div1</div>' +
            '</div>')
    this.clock.tick(1)
    div.parentElement.removeChild(div)
    this.eventSource.sendEvent('e1')
    this.eventSource.readyState.should.equal(EventSource.CLOSED)
  })

  it('swaps content properly on SSE swap', function() {
    var div = make('<div hx-ext="sse" sse-connect="/event_stream">\n' +
            '  <div id="d1" sse-swap="e1"></div>\n' +
            '  <div id="d2" sse-swap="e2"></div>\n' +
            '</div>\n')
    this.clock.tick(1)
    byId('d1').innerText.should.equal('')
    byId('d2').innerText.should.equal('')
    this.eventSource.sendEvent('e1', 'Event 1')
    byId('d1').innerText.should.equal('Event 1')
    byId('d2').innerText.should.equal('')
    this.eventSource.sendEvent('e2', 'Event 2')
    byId('d1').innerText.should.equal('Event 1')
    byId('d2').innerText.should.equal('Event 2')
  })

  it('swaps swapped in content', function() {
    var div = make('<div hx-ext="sse" sse-connect="/event_stream">\n' +
            '<div id="d1" sse-swap="e1" hx-swap="outerHTML"></div>\n' +
            '</div>\n'
    )
    this.clock.tick(1)

    this.eventSource.sendEvent('e1', '<div id="d2" sse-swap="e2"></div>')
    this.eventSource.sendEvent('e2', 'Event 2')
    byId('d2').innerText.should.equal('Event 2')
  })

  it('works in a child of an hx-ext="sse" element', function() {
    var div = make('<div hx-ext="sse">\n' +
            '<div id="d1" sse-connect="/event_stream" sse-swap="e1">div1</div>\n' +
            '</div>\n'
    )
    this.clock.tick(1)
    this.eventSource.sendEvent('e1', 'Event 1')
    byId('d1').innerText.should.equal('Event 1')
  })

  it('only adds sseEventSource to elements with sse-connect', function() {
    var div = make('<div hx-ext="sse" sse-connect="/event_stream" >\n' +
            '<div id="d1" sse-swap="e1"></div>\n' +
            '</div>');
    this.clock.tick(1);

    (byId('d1')['htmx-internal-data'].sseEventSource == undefined).should.be.true

    // Even when content is swapped in
    this.eventSource.sendEvent('e1', '<div id="d2" sse-swap="e2"></div>');

    (byId('d2')['htmx-internal-data'].sseEventSource == undefined).should.be.true
  })

  it('triggers events with naked hx-trigger', function() {
    var div = make( '<div hx-ext="sse"><div sse-connect="/foo"><div id="d2" hx-trigger="sse:e2">div2</div></div></div>')
    this.clock.tick(1)

    let triggerCounter = 0
    div.addEventListener("htmx:trigger", () => triggerCounter++)
    let sseMessageCounter = 0
    div.addEventListener("htmx:sseMessage", () => sseMessageCounter++)

    this.eventSource.sendEvent('e2')

    triggerCounter.should.be.equal(1)
    sseMessageCounter.should.be.equal(1)
  })

  it('initializes connections in swapped content', function() {
    this.server.respondWith('GET', '/d1', '<div><div sse-connect="/foo"><div id="d2" hx-trigger="sse:e2" hx-get="/d2">div2</div></div></div>')
    this.server.respondWith('GET', '/d2', 'div2 updated')

    var div = make('<div hx-ext="sse" hx-get="/d1"></div>')
    this.clock.tick(1)
    div.click()

    this.server.respond()
    this.clock.tick(1)
    this.eventSource.sendEvent('e2')
    this.server.respond()

    byId('d2').innerHTML.should.equal('div2 updated')
  })

  it('creates an eventsource on elements with sse-connect', function() {
    var div = make('<div hx-ext="sse"><div id="d1"sse-connect="/event_stream"></div></div>');
    this.clock.tick(1);

    (byId('d1')['htmx-internal-data'].sseEventSource == undefined).should.be.false
  })

  it('raises htmx:sseBeforeMessage when receiving message from the server', function() {
    var myEventCalled = false

    function handle(evt) {
      myEventCalled = true
    }

    htmx.on('htmx:sseBeforeMessage', handle)

    var div = make('<div hx-ext="sse" sse-connect="/event_stream" sse-swap="e1"></div>')
    this.clock.tick(1)

    this.eventSource.sendEvent('e1', '<div id="d1"></div>')

    myEventCalled.should.be.true

    htmx.off('htmx:sseBeforeMessage', handle)
  })

  it('cancels swap when htmx:sseBeforeMessage was cancelled', function() {
    var myEventCalled = false

    function handle(evt) {
      myEventCalled = true
      evt.preventDefault()
    }

    htmx.on('htmx:sseBeforeMessage', handle)

    var div = make('<div hx-ext="sse" sse-connect="/event_stream" sse-swap="e1"><div id="d1">div1</div></div>')
    this.clock.tick(1)

    this.eventSource.sendEvent('e1', '<div id="d1">replaced</div>')

    myEventCalled.should.be.true

    byId('d1').innerHTML.should.equal('div1')

    htmx.off('htmx:sseBeforeMessage', handle)
  })

  it('raises htmx:sseMessage when message was completely processed', function() {
    var myEventCalled = false

    function handle(evt) {
      myEventCalled = true
    }

    htmx.on('htmx:sseMessage', handle)

    var div = make('<div hx-ext="sse" sse-connect="/event_stream" sse-swap="e1"><div id="d1">div1</div></div>')
    this.clock.tick(1)

    this.eventSource.sendEvent('e1', '<div id="d1">replaced</div>')

    myEventCalled.should.be.true
    byId('d1').innerHTML.should.equal('replaced')

    htmx.off('htmx:sseMessage', handle)
  })

  it('handles sse reconnection', function() {
    this.server.respondWith('GET', '/d1', 'div1 updated')
    this.server.respondWith('GET', '/d2', 'div2 updated')

    var div = make('<div hx-ext="sse" sse-connect="/foo">' +
      '<div id="d1" hx-trigger="sse:e1" hx-get="/d1">div1</div>' +
      '<div id="d2" hx-trigger="sse:e2" hx-get="/d2">div2</div>' +
      '</div>')
    this.clock.tick(1)

    this.eventSource.sendEvent('e1')
    this.server.respond()
    byId('d1').innerHTML.should.equal('div1 updated')
    byId('d2').innerHTML.should.equal('div2')

    var oldEventSource = this.eventSource
    this.eventSource.should.equal(oldEventSource)

    var sseErrorCalled = false
    div.addEventListener("htmx:sseError", function(){
      sseErrorCalled = true
    })

    this.eventSource.simulateConnectionError()
    this.eventSource.readyState.should.equal(EventSource.CLOSED)

    this.clock.tick(500)
    sseErrorCalled.should.equal(true)
    this.eventSource.should.not.equal(oldEventSource)
    this.eventSource.readyState.should.equal(EventSource.CONNECTING)
    this.clock.tick(1)
    this.eventSource.readyState.should.equal(EventSource.OPEN)

    this.eventSource.sendEvent('e2')
    this.server.respond()
    byId('d1').innerHTML.should.equal('div1 updated')
    byId('d2').innerHTML.should.equal('div2 updated')
  })

  it('reconnection retry timeout properly increases over attempts', function() {
    this.server.respondWith('GET', '/d1', 'div1 updated')
    this.server.respondWith('GET', '/d2', 'div2 updated')

    var div = make('<div hx-ext="sse" sse-connect="/foo">' +
      '<div id="d1" hx-trigger="sse:e1" hx-get="/d1">div1</div>' +
      '<div id="d2" hx-trigger="sse:e2" hx-get="/d2">div2</div>' +
      '</div>')
    this.clock.tick(1)

    this.eventSource.sendEvent('e1')
    this.server.respond()
    byId('d1').innerHTML.should.equal('div1 updated')
    byId('d2').innerHTML.should.equal('div2')

    var oldEventSource = this.eventSource
    this.eventSource.should.equal(oldEventSource)

    this.eventSource.simulateConnectionError()
    this.clock.tick(300)
    this.eventSource.should.equal(oldEventSource)
    this.eventSource.readyState.should.equal(EventSource.CLOSED)
    this.clock.tick(200)
    this.eventSource.should.not.equal(oldEventSource)
    this.eventSource.failConnections = true
    this.eventSource.readyState.should.equal(EventSource.CONNECTING)
    this.clock.tick(1)
    this.eventSource.readyState.should.equal(EventSource.CLOSED)

    this.clock.tick(800)
    this.eventSource.readyState.should.equal(EventSource.CLOSED)
    this.clock.tick(200)
    this.eventSource.readyState.should.equal(EventSource.CONNECTING)
    this.eventSource.failConnections = true
    this.clock.tick(1)
    this.eventSource.readyState.should.equal(EventSource.CLOSED)

    this.clock.tick(1950)
    this.eventSource.readyState.should.equal(EventSource.CLOSED)
    this.clock.tick(50)
    this.eventSource.readyState.should.equal(EventSource.CONNECTING)
    this.eventSource.failConnections = true
    this.clock.tick(1)
    this.eventSource.readyState.should.equal(EventSource.CLOSED)

    this.clock.tick(3950)
    this.eventSource.readyState.should.equal(EventSource.CLOSED)
    this.clock.tick(50)
    this.eventSource.readyState.should.equal(EventSource.CONNECTING)
    this.eventSource.failConnections = true
    this.clock.tick(1)
    this.eventSource.readyState.should.equal(EventSource.CLOSED)

    this.clock.tick(7999)
    this.eventSource.readyState.should.equal(EventSource.CLOSED)
    this.clock.tick(1)
    this.eventSource.readyState.should.equal(EventSource.CONNECTING)
    this.eventSource.failConnections = true
    this.clock.tick(1)
    this.eventSource.readyState.should.equal(EventSource.CLOSED)

    this.clock.tick(15999)
    this.eventSource.readyState.should.equal(EventSource.CLOSED)
    this.clock.tick(1)
    this.eventSource.readyState.should.equal(EventSource.CONNECTING)
    this.eventSource.failConnections = true
    this.clock.tick(1)
    this.eventSource.readyState.should.equal(EventSource.CLOSED)

    this.clock.tick(31999)
    this.eventSource.readyState.should.equal(EventSource.CLOSED)
    this.clock.tick(1)
    this.eventSource.readyState.should.equal(EventSource.CONNECTING)
    this.eventSource.failConnections = true
    this.clock.tick(1)
    this.eventSource.readyState.should.equal(EventSource.CLOSED)

    this.clock.tick(63999)
    this.eventSource.readyState.should.equal(EventSource.CLOSED)
    this.clock.tick(1)
    this.eventSource.readyState.should.equal(EventSource.CONNECTING)
    this.eventSource.failConnections = true
    this.clock.tick(1)
    this.eventSource.readyState.should.equal(EventSource.CLOSED)

    // Doesn't go higher than 64s
    this.clock.tick(63999)
    this.eventSource.readyState.should.equal(EventSource.CLOSED)
    this.clock.tick(1)
    this.eventSource.readyState.should.equal(EventSource.CONNECTING)
    this.eventSource.failConnections = true
    this.clock.tick(1)
    this.eventSource.readyState.should.equal(EventSource.CLOSED)

    this.clock.tick(63999)
    this.eventSource.readyState.should.equal(EventSource.CLOSED)
    this.clock.tick(1)
    this.eventSource.readyState.should.equal(EventSource.CONNECTING)
    this.clock.tick(1)
    this.eventSource.readyState.should.equal(EventSource.OPEN)

    this.eventSource.sendEvent('e2')
    this.server.respond()
    byId('d1').innerHTML.should.equal('div1 updated')
    byId('d2').innerHTML.should.equal('div2 updated')
  })

  it('reconnection retry timeout properly resets on successful connection', function() {
    this.server.respondWith('GET', '/d1', 'div1 updated')
    this.server.respondWith('GET', '/d2', 'div2 updated')

    var div = make('<div hx-ext="sse" sse-connect="/foo">' +
      '<div id="d1" hx-trigger="sse:e1" hx-get="/d1">div1</div>' +
      '<div id="d2" hx-trigger="sse:e2" hx-get="/d2">div2</div>' +
      '</div>')
    this.clock.tick(1)

    this.eventSource.sendEvent('e1')
    this.server.respond()
    byId('d1').innerHTML.should.equal('div1 updated')
    byId('d2').innerHTML.should.equal('div2')

    var oldEventSource = this.eventSource
    this.eventSource.should.equal(oldEventSource)

    this.eventSource.simulateConnectionError()
    // Reconnection delays starts at 500ms
    this.clock.tick(300)
    this.eventSource.should.equal(oldEventSource)
    this.eventSource.readyState.should.equal(EventSource.CLOSED)
    this.clock.tick(200)
    this.eventSource.should.not.equal(oldEventSource)
    this.eventSource.readyState.should.equal(EventSource.CONNECTING)
    this.eventSource.failConnections = true
    this.clock.tick(1)
    this.eventSource.readyState.should.equal(EventSource.CLOSED)
    oldEventSource = this.eventSource

    // Delay increases to 1s on the second attempt
    this.clock.tick(800)
    this.eventSource.readyState.should.equal(EventSource.CLOSED)
    this.eventSource.should.equal(oldEventSource)
    this.clock.tick(200)
    this.eventSource.should.not.equal(oldEventSource)
    this.eventSource.readyState.should.equal(EventSource.CONNECTING)
    this.clock.tick(1)
    this.eventSource.readyState.should.equal(EventSource.OPEN)
    oldEventSource = this.eventSource

    // Delay resets to minimum (500ms) after a successful connection
    this.eventSource.simulateConnectionError()
    this.clock.tick(499)
    this.eventSource.should.equal(oldEventSource)
    this.eventSource.readyState.should.equal(EventSource.CLOSED)
    this.clock.tick(1)
    this.eventSource.should.not.equal(oldEventSource)
    this.eventSource.readyState.should.equal(EventSource.CONNECTING)
    this.clock.tick(1)
    this.eventSource.readyState.should.equal(EventSource.OPEN)

    this.eventSource.sendEvent('e2')
    this.server.respond()
    byId('d1').innerHTML.should.equal('div1 updated')
    byId('d2').innerHTML.should.equal('div2 updated')
  })
})
