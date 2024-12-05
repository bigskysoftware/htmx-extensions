describe('preload extension handles different trigger events', function() {
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

  it('preloads element with preload attribute on touchstart', function() {
    const hyperlink = make('<a href="/test" preload>Link</a>')

    htmx.trigger(hyperlink, 'touchstart')

    should.equal(requests.length, 1)
    should.equal(requests[0].url, '/test')
  })

  it('preloads element with preload="mouseover" attribute 100ms after mouseover', function() {
    const hyperlink = make('<a href="/test" preload="mouseover">Link</a>')

    htmx.trigger(hyperlink, 'mouseover')
    this.clock.tick(100)

    should.equal(requests.length, 1)
    should.equal(requests[0].url, '/test')
  })

  it('preloads element with preload="mouseover" attribute on touchstart', function() {
    const hyperlink = make('<a href="/test" preload="mouseover">Link</a>')

    htmx.trigger(hyperlink, 'touchstart')

    should.equal(requests.length, 1)
    should.equal(requests[0].url, '/test')
  })

  it('does not preload element with preload="mouseover" attribute if mouseout fires 99ms after mouseover', function() {
    const hyperlink = make('<a href="/test" preload="mouseover">Link</a>')

    htmx.trigger(hyperlink, 'mouseover')
    setTimeout(() => {
      htmx.trigger(hyperlink, 'mouseout')
    }, 99)
    this.clock.tick(99)

    should.equal(requests.length, 0)
  })

  it('does not preload element with preload attribute 100ms after mouseover', function() {
    const hyperlink = make('<a href="/test" preload>Link</a>')

    htmx.trigger(hyperlink, 'mouseover')
    this.clock.tick(100)

    should.equal(requests.length, 0)
  })
})
