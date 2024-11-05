describe('preload extension preloads hyperlinks and hx-get elements', function() {
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

  it('preloads hyperlink with preload attribute', function() {
    const hyperlink = make('<a href="/test" preload>Link</a>')

    htmx.trigger(hyperlink, 'mousedown')

    should.equal(requests.length, 1)
    should.equal(requests[0].url, '/test')
  })

  it('preloads hyperlink which inherits preload attribute form parent div', function() {
    make('<div preload><a href="/test" id="link">Link</a></div>')
    const hyperlink = byId("link")

    htmx.trigger(hyperlink, 'mousedown')

    should.equal(requests.length, 1)
    should.equal(requests[0].url, '/test')
  })

  it('does not preload hyperlink without preload attribute', function() {
    const hyperlink = make('<a href="/test">Link</a>')

    htmx.trigger(hyperlink, 'mousedown')

    should.equal(requests.length, 0)
  })

  it('preloads button with hx-get and preload attributes', function() {
    const button = make('<button hx-get="/test" preload>Button</button>')

    htmx.trigger(button, 'mousedown')

    should.equal(requests.length, 1)
    should.equal(requests[0].url, '/test')
  })

  it('does not preload button with hx-get and without preload attribute', function() {
    const button = make('<button hx-get="/test">Button</button>')

    htmx.trigger(button, 'mousedown')
    
    should.equal(requests.length, 0)
  })

  it('does not preload button with hx-post and preload attributes', function() {
    const button = make('<button hx-post="/test">Button</button>')

    htmx.trigger(button, 'mousedown')
    
    should.equal(requests.length, 0)
  })
})
