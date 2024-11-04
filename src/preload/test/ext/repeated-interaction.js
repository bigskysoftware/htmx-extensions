describe('preload extension handling repeated interaction', function() {
  let requests = [];

  beforeEach(function() {
    this.server = makeServer()
    const defaultOnCreateFunction = this.server.xhr.onCreate
    this.server.xhr.onCreate = function(xhr) {
      defaultOnCreateFunction(xhr)
      requests.push(xhr)
    }
    clearWorkArea()
    getWorkArea().setAttribute('hx-ext', 'preload')
  })
  
  afterEach(function() {
    this.server.restore()
    requests = []
    getWorkArea().removeAttribute('hx-ext')
    clearWorkArea()
  })

  it('preloads hyperlink with preload attribute once despite two mousedowns', function() {
    const hyperlink = make('<a href="/test" preload>Link</a>')

    htmx.trigger(hyperlink, 'mousedown')
    htmx.trigger(hyperlink, 'mousedown')
    this.server.respond()

    should.equal(requests.length, 1)
    should.equal(requests[0].url, '/test')
  })

  it('preloads hyperlink with preload="mousedown always" attribute twice', function() {
    const hyperlink = make('<a href="/test" preload="mousedown always">Link</a>')

    htmx.trigger(hyperlink, 'mousedown')
    this.server.respond()
    htmx.trigger(hyperlink, 'mousedown')
    this.server.respond()

    should.equal(requests.length, 2)
  })
})
