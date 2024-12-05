describe('preload extension handles repeated interaction', function() {
  let requests = [];

  beforeEach(function() {
    this.server = makeServer()
    const defaultOnCreateFunction = this.server.xhr.onCreate
    this.server.xhr.onCreate = function(xhr) {
      defaultOnCreateFunction(xhr)
      requests.push(xhr)
    }
    this.clock = sinon.useFakeTimers()
    clearWorkArea()
    getWorkArea().setAttribute('hx-ext', 'preload')
  })
  
  afterEach(function() {
    this.server.restore()
    requests = []
    this.clock.restore()
    getWorkArea().removeAttribute('hx-ext')
    clearWorkArea()
  })

  it('preloads hyperlink with preload attribute once despite two mousedowns', function() {
    const hyperlink = make('<a href="/test" preload>Link</a>')

    htmx.trigger(hyperlink, 'mousedown')
    this.server.respond()
    htmx.trigger(hyperlink, 'mousedown')

    should.equal(requests.length, 1)
    should.equal(requests[0].url, '/test')
  })

  it('preloads hyperlink with preload="always" attribute three times', function() {
    const hyperlink = make('<a href="/test" preload="always">Link</a>')

    htmx.trigger(hyperlink, 'mousedown')
    this.server.respond()
    htmx.trigger(hyperlink, 'mousedown')
    this.server.respond()
    htmx.trigger(hyperlink, 'mousedown')

    should.equal(requests.length, 3)
  })

  it('preloads hyperlink with preload="mousedown always" attribute three times', function() {
    const hyperlink = make('<a href="/test" preload="mousedown always">Link</a>')

    htmx.trigger(hyperlink, 'mousedown')
    this.server.respond()
    htmx.trigger(hyperlink, 'mousedown')
    this.server.respond()
    htmx.trigger(hyperlink, 'mousedown')

    should.equal(requests.length, 3)
  })

  it('preloads hyperlink with preload="always mousedown" attribute three times', function() {
    const hyperlink = make('<a href="/test" preload="always mousedown">Link</a>')

    htmx.trigger(hyperlink, 'mousedown')
    this.server.respond()
    htmx.trigger(hyperlink, 'mousedown')
    this.server.respond()
    htmx.trigger(hyperlink, 'mousedown')

    should.equal(requests.length, 3)
  })

  it('preloads hyperlink with preload="mouseover always" attribute three times', function() {
    const hyperlink = make('<a href="/test" preload="mouseover always">Link</a>')

    htmx.trigger(hyperlink, 'mouseover')
    this.clock.tick(100)
    this.server.respond()
    htmx.trigger(hyperlink, 'mouseover')
    this.clock.tick(100)
    this.server.respond()
    htmx.trigger(hyperlink, 'mouseover')
    this.clock.tick(100)

    should.equal(requests.length, 3)
  })
})
