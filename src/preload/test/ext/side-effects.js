describe('preload extension does not cause the side-effects of HTMX requests', function() {
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

    it('does not add .htmx-request class to source node', function() {
        const button = make('<button hx-get="/test" preload>Button</button>')

        htmx.trigger(button, 'mousedown')

        button.should.not.have.class("htmx-request")
    })

    it('does not add .htmx-request class to hx-indicator', function() {
        const button = make('<button hx-get="/test" hx-indicator="#loading-indicator" preload>Button</button>')
        const indicator = make('<div id="loading-indicator">Loading...</div>')

        htmx.trigger(button, 'mousedown')

        indicator.should.not.have.class("htmx-request")
    })
})