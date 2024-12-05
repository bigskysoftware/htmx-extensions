describe('preload extension preloads linked images', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
    getWorkArea().setAttribute('hx-ext', 'preload')
  })
  
  afterEach(function() {
    this.server.restore()
    getWorkArea().removeAttribute('hx-ext')
    clearWorkArea()
  })

  it('preloads linked image if button has preload-images="true" attribute', function(done) {
    let imageLoaded = false
    const button = make('<button hx-get="/test" preload preload-images="true">Button</button>')
    this.server.respondWith('GET', '/test', `<img src="image.jpeg" onload="htmx.trigger(document.body, 'imageLoaded')">`)
    const handler = htmx.on('imageLoaded', function() {
      htmx.off('imageLoaded', handler)
      imageLoaded = true
      done()
    })
    try {
      htmx.trigger(button, 'mousedown')
      this.server.respond()
    } finally {
      setTimeout(function() {
        htmx.off('imageLoaded', handler)
        if (!imageLoaded) {
          done(new Error("Image was not preloaded"))
        }
      }, 100)
    }
  })

  it('preloads linked image if button inherits preload-images="true" attribute from parent div', function(done) {
    let imageLoaded = false
    make('<div preload-images="true"><button id="button" hx-get="/test" preload>Button</button></div>')
    const button = byId("button")
    this.server.respondWith('GET', '/test', `<img src="image.jpeg" onload="htmx.trigger(document.body, 'imageLoaded')">`)
    const handler = htmx.on('imageLoaded', function() {
      htmx.off('imageLoaded', handler)
      imageLoaded = true
      done()
    })
    try {
      htmx.trigger(button, 'mousedown')
      this.server.respond()
    } finally {
      setTimeout(function() {
        htmx.off('imageLoaded', handler)
        if (!imageLoaded) {
          done(new Error("Image was not preloaded"))
        }
      }, 100)
    }
  })

  it('does not preload linked image if button does not have preload-images attribute', function(done) {
    let imageLoaded = false
    const button = make('<button hx-get="/test" preload>Button</button>')
    this.server.respondWith('GET', '/test', `<img src="image.jpeg" onload="htmx.trigger(document.body, 'imageLoaded')">`)
    const handler = htmx.on('imageLoaded', function() {
      htmx.off('imageLoaded', handler)
      imageLoaded = true
      done(new Error("Image was preloaded"))
    })
    try {
      htmx.trigger(button, 'mousedown')
      this.server.respond()
    } finally {
      setTimeout(function() {
        htmx.off('imageLoaded', handler)
        if (!imageLoaded) {
          done()
        }
      }, 100)
    }
  })
})