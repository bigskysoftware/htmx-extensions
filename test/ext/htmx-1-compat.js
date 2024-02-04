describe('htmx-1-compat extension', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
    getWorkArea().setAttribute('hx-ext', 'htmx-1-compat')
  })
  afterEach(function() {
    this.server.restore()
    getWorkArea().removeAttribute('hx-ext')
    clearWorkArea()
  })

  it('correctly reverts htmx 1 default config properties', function() {
    htmx.config.scrollBehavior.should.equal('smooth')
    htmx.config.methodsThatUseUrlParams.should.eql(['get'])
    htmx.config.selfRequestsOnly.should.equal(false)
    htmx.config.head.boost.should.equal('none')
  })

  describe('hx-ws attribute', function() {
    function mockWebsocket() {
      var listener
      var lastSent
      var wasClosed = false
      var mockSocket = {
        addEventListener: function(message, l) {
          listener = l
        },
        write: function(content) {
          return listener({ data: content })
        },
        send: function(data) {
          lastSent = data
        },
        getLastSent: function() {
          return lastSent
        },
        close: function() {
          wasClosed = true
        },
        wasClosed: function() {
          return wasClosed
        }
      }
      return mockSocket
    }

    beforeEach(function() {
      this.server = makeServer()
      var socket = mockWebsocket()
      this.socket = socket
      clearWorkArea()
      this.oldCreateWebSocket = htmx.createWebSocket
      htmx.createWebSocket = function() {
        return socket
      }
    })
    afterEach(function() {
      this.server.restore()
      clearWorkArea()
      htmx.createWebSocket = this.oldCreateWebSocket
    })

    it('handles a basic call back', function() {
      var div = make('<div hx-ws="connect:/foo"><div id="d1">div1</div><div id="d2">div2</div></div>')
      this.socket.write('<div id="d1">replaced</div>')
      byId('d1').innerHTML.should.equal('replaced')
      byId('d2').innerHTML.should.equal('div2')
    })

    it('handles a basic send', function() {
      var div = make('<div hx-ws="connect:/foo"><div hx-ws="send" id="d1">div1</div></div>')
      byId('d1').click()
      var lastSent = this.socket.getLastSent()
      var data = JSON.parse(lastSent)
      data.HEADERS['HX-Request'].should.equal('true')
    })

    it('is closed after removal', function() {
      this.server.respondWith('GET', '/test', 'Clicked!')
      var div = make('<div hx-get="/test" hx-swap="outerHTML" hx-ws="connect:wss:/foo"></div>')
      div.click()
      this.server.respond()
      this.socket.wasClosed().should.equal(true)
    })

    it('is closed after removal with no close and activity', function() {
      var div = make('<div hx-ws="connect:/foo"></div>')
      div.parentElement.removeChild(div)
      this.socket.write('<div id="d1">replaced</div>')
      this.socket.wasClosed().should.equal(true)
    })
  })

  describe('hx-sse attribute', function() {
    function mockEventSource() {
      var listeners = {}
      var wasClosed = false
      var mockEventSource = {
        removeEventListener: function(name, l) {
          listeners[name] = listeners[name].filter(function(elt, idx, arr) {
            if (arr[idx] === l) {
              return false
            }
            return true
          })
        },
        addEventListener: function(message, l) {
          if (listeners[message] == undefined) {
            listeners[message] = []
          }
          listeners[message].push(l)
        },
        sendEvent: function(eventName, data) {
          if (listeners[eventName]) {
            listeners[eventName].forEach(function(listener) {
              var event = htmx._('makeEvent')(eventName)
              event.data = data
              listener(event)
            })
          }
        },
        close: function() {
          wasClosed = true
        },
        wasClosed: function() {
          return wasClosed
        }
      }
      return mockEventSource
    }

    beforeEach(function() {
      this.server = makeServer()
      var eventSource = mockEventSource()
      this.eventSource = eventSource
      clearWorkArea()
      htmx.createEventSource = function() {
        return eventSource
      }
    })
    afterEach(function() {
      this.server.restore()
      clearWorkArea()
    })

    it('handles basic sse triggering', function() {
      this.server.respondWith('GET', '/d1', 'div1 updated')
      this.server.respondWith('GET', '/d2', 'div2 updated')

      var div = make('<div hx-sse="connect:/foo">' +
        '<div id="d1" hx-trigger="sse:e1" hx-get="/d1">div1</div>' +
        '<div id="d2" hx-trigger="sse:e2" hx-get="/d2">div2</div>' +
        '</div>')

      this.eventSource.sendEvent('e1')
      this.server.respond()
      byId('d1').innerHTML.should.equal('div1 updated')
      byId('d2').innerHTML.should.equal('div2')

      this.eventSource.sendEvent('e2')
      this.server.respond()
      byId('d1').innerHTML.should.equal('div1 updated')
      byId('d2').innerHTML.should.equal('div2 updated')
    })

    it('does not trigger events that arent named', function() {
      this.server.respondWith('GET', '/d1', 'div1 updated')

      var div = make('<div hx-sse="connect:/foo">' +
        '<div id="d1" hx-trigger="sse:e1" hx-get="/d1">div1</div>' +
        '</div>')

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

      var div = make('<div hx-sse="connect:/foo"></div>' +
        '<div id="d1" hx-trigger="sse:e1" hx-get="/d1">div1</div>')

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

    it('is closed after removal', function() {
      this.server.respondWith('GET', '/test', 'Clicked!')
      var div = make('<div hx-get="/test" hx-swap="outerHTML" hx-sse="connect:/foo">' +
        '<div id="d1" hx-trigger="sse:e1" hx-get="/d1">div1</div>' +
        '</div>')
      div.click()
      this.server.respond()
      this.eventSource.wasClosed().should.equal(true)
    })

    it('is closed after removal with no close and activity', function() {
      var div = make('<div hx-get="/test" hx-swap="outerHTML" hx-sse="connect:/foo">' +
        '<div id="d1" hx-trigger="sse:e1" hx-get="/d1">div1</div>' +
        '</div>')
      div.parentElement.removeChild(div)
      this.eventSource.sendEvent('e1')
      this.eventSource.wasClosed().should.equal(true)
    })

    it('swaps content properly on SSE swap', function() {
      var div = make('<div hx-sse="connect:/event_stream">\n' +
        '  <div id="d1" hx-sse="swap:e1"></div>\n' +
        '  <div id="d2" hx-sse="swap:e2"></div>\n' +
        '</div>\n')
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
      var div = make('<div hx-sse="connect:/event_stream">\n' +
        '<div id="d1" hx-sse="swap:e1" hx-swap="outerHTML"></div>\n' +
        '</div>\n'
      )

      this.eventSource.sendEvent('e1', '<div id="d2" hx-sse="swap:e2"></div>')
      this.eventSource.sendEvent('e2', 'Event 2')
      byId('d2').innerText.should.equal('Event 2')
    })
  })

  describe('hx-on attribute', function() {
    beforeEach(function() {
      this.server = makeServer()
      clearWorkArea()
    })
    afterEach(function() {
      this.server.restore()
      clearWorkArea()
    })

    it('can handle basic events w/ no other attributes', function() {
      var btn = make('<button hx-on=\'click: window.foo = true\'>Foo</button>')
      btn.click()
      window.foo.should.equal(true)
      delete window.foo
    })

    it('can modify a parameter via htmx:configRequest', function() {
      this.server.respondWith('POST', '/test', function(xhr) {
        var params = parseParams(xhr.requestBody)
        xhr.respond(200, {}, params.foo)
      })
      var btn = make('<button hx-on=\'htmx:configRequest: event.detail.parameters.foo = "bar"\' hx-post=\'/test\'>Foo</button>')
      btn.click()
      this.server.respond()
      btn.innerText.should.equal('bar')
    })

    it('can cancel an event via preventDefault for htmx:configRequest', function() {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(200, {}, '<button>Bar</button>')
      })
      var btn = make('<button hx-on=\'htmx:configRequest: event.preventDefault()\' hx-post=\'/test\' hx-swap=\'outerHTML\'>Foo</button>')
      btn.click()
      this.server.respond()
      btn.innerText.should.equal('Foo')
    })

    it('can respond to kebab-case events', function() {
      this.server.respondWith('POST', '/test', function(xhr) {
        var params = parseParams(xhr.requestBody)
        xhr.respond(200, {}, params.foo)
      })
      var btn = make('<button hx-on=\'htmx:config-request: event.detail.parameters.foo = "bar"\' hx-post=\'/test\'>Foo</button>')
      btn.click()
      this.server.respond()
      btn.innerText.should.equal('bar')
    })

    it('has the this symbol set to the element', function() {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(200, {}, 'foo')
      })
      var btn = make('<button hx-on=\'htmx:config-request: window.elt = this\' hx-post=\'/test\'>Foo</button>')
      btn.click()
      this.server.respond()
      btn.innerText.should.equal('foo')
      btn.should.equal(window.elt)
      delete window.elt
    })

    it('can handle multi-line JSON', function() {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(200, {}, 'foo')
      })
      var btn = make('<button hx-on=\'htmx:config-request: window.elt = {foo: true,\n' +
        '                                                             bar: false}\' hx-post=\'/test\'>Foo</button>')
      btn.click()
      this.server.respond()
      btn.innerText.should.equal('foo')
      var obj = {
        foo: true,
        bar: false
      }
      obj.should.deep.equal(window.elt)
      delete window.elt
    })

    it('can handle multiple event handlers in the presence of multi-line JSON', function() {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(200, {}, 'foo')
      })
      var btn = make('<button hx-on=\'htmx:config-request: window.elt = {foo: true,\n' +
        '                                                             bar: false}\n' +
        '                          htmx:afterRequest: window.foo = true\'' +
        ' hx-post=\'/test\'>Foo</button>')
      btn.click()
      this.server.respond()
      btn.innerText.should.equal('foo')

      var obj = {
        foo: true,
        bar: false
      }
      obj.should.deep.equal(window.elt)
      delete window.elt

      window.foo.should.equal(true)
      delete window.foo
    })

    it('de-initializes hx-on content properly', function() {
      window.tempCount = 0
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(200, {}, '<button id=\'foo\' hx-on="click: window.tempCount++;">increment</button>')
      })
      var div = make('<div hx-post=\'/test\'>Foo</div>')

      // get response
      div.click()
      this.server.respond()

      // click button
      byId('foo').click()
      window.tempCount.should.equal(1)

      // get second response
      div.click()
      this.server.respond()

      // click button again
      byId('foo').click()
      window.tempCount.should.equal(2)

      delete window.tempCount
    })

    it('is not evaluated when allowEval is false', function() {
      var calledEvent = false
      var handler = htmx.on('htmx:evalDisallowedError', function() {
        calledEvent = true
      })
      htmx.config.allowEval = false
      try {
        var btn = make('<button hx-on=\'click: window.foo = true\'>Foo</button>')
        btn.click()
        should.not.exist(window.foo)
      } finally {
        htmx.config.allowEval = true
        htmx.off('htmx:evalDisallowedError', handler)
        delete window.foo
      }
      calledEvent.should.equal(true)
    })

    it('can handle event types with dots', function() {
      var btn = make('<button hx-on=\'my.custom.event: window.foo = true\'>Foo</button>')
      // IE11 doesn't support `new CustomEvent()` so call htmx' internal utility function
      btn.dispatchEvent(htmx._('makeEvent')('my.custom.event'))
      window.foo.should.equal(true)
      delete window.foo
    })

    it('can handle being swapped using innerHTML', function() {
      this.server.respondWith('GET', '/test', function(xhr) {
        xhr.respond(200, {}, '<button id="bar" hx-on="click: window.bar = true">Bar</button>')
      })

      make(
        '<div>' +
        '<button id="swap" hx-get="/test" hx-target="#baz" hx-swap="innerHTML">Swap</button>' +
        '<div id="baz"><button id="foo" hx-on="click: window.foo = true">Foo</button></div>' +
        '</div>'
      )

      var fooBtn = byId('foo')
      fooBtn.click()
      window.foo.should.equal(true)

      var swapBtn = byId('swap')
      swapBtn.click()
      this.server.respond()

      var barBtn = byId('bar')
      barBtn.click()
      window.bar.should.equal(true)

      delete window.foo
      delete window.bar
    })

    it('cleans up all handlers when the DOM updates', function() {
      // setup
      window.foo = 0
      window.bar = 0
      var div = make('<div hx-on=\'increment-foo: window.foo++\nincrement-bar: window.bar++\'>Foo</div>')
      make('<div>Another Div</div>') // sole purpose is to update the DOM

      // check there is just one handler against each event
      htmx.trigger(div, 'increment-foo')
      htmx.trigger(div, 'increment-bar')
      window.foo.should.equal(1)
      window.bar.should.equal(1)

      // teardown
      delete window.foo
      delete window.bar
    })
  })
})
