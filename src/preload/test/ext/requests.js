describe('preload extension sends requests which match element requests', function() {
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

    it('includes HX-Preloaded header when preloading hyperlink', function() {
      const hyperlink = make('<a href="/test" preload>Link</a>')
  
      htmx.trigger(hyperlink, 'mousedown')
      
      should.equal(requests.length, 1)
      requests[0].requestHeaders.should.deep.contain({"HX-Preloaded": "true"})
    })

    it('includes HX-Preloaded header when preloading xh-boosted hyperlink', function() {
      const hyperlink = make('<a href="/test" hx-boost="true" preload>Link</a>')
  
      htmx.trigger(hyperlink, 'mousedown')
      
      should.equal(requests.length, 1)
      requests[0].requestHeaders.should.deep.contain({"HX-Preloaded": "true"})
    })

    it('includes HX-Preloaded header when preloading button with hx-get attribute', function() {
      const button = make('<button hx-get="/test" preload>Button</button>')

      htmx.trigger(button, 'mousedown')
  
      should.equal(requests.length, 1)
      requests[0].requestHeaders.should.deep.contain({"HX-Preloaded": "true"})
    })

    it('matches url and includes headers for hx-boosted hyperlink', function() {
      const hyperlink = make('<a href="/test" hx-boost="true" preload>Link</a>')
  
      htmx.trigger(hyperlink, 'mousedown')
      this.server.respond()
      hyperlink.click()
      
      should.equal(requests.length, 2)
      should.equal(requests[0].url, requests[1].url)
      should.equal(requests[0].method, requests[1].method)
      requests[0].requestHeaders.should.deep.contain(requests[1].requestHeaders)
    })

    it('matches url and includes headers for hx-boosted form', function(){
      const form = make(`
        <form action="/test" method="get" hx-boost="true" preload>
          <input type="text" name="name" value="John">
          <input type="submit" value="Submit">
        </form>
      `)
      const submitButton = form.querySelector("input[type='submit']")

      htmx.trigger(submitButton, 'mousedown')
      this.server.respond()
      submitButton.click()

      should.equal(requests.length, 2)
      should.equal(requests[0].url, requests[1].url)
      should.equal(requests[0].method, requests[1].method)
      requests[0].requestHeaders.should.deep.contain(requests[1].requestHeaders)
    })

    it('matches url and includes headers for hx-get button', function() {
      const button = make('<button hx-get="/test" preload>Button</button>')
  
      htmx.trigger(button, 'mousedown')
      this.server.respond()
      button.click()
      
      should.equal(requests.length, 2)
      should.equal(requests[0].url, requests[1].url)
      should.equal(requests[0].method, requests[1].method)
      requests[0].requestHeaders.should.deep.contain(requests[1].requestHeaders)
    })

    it('matches url and includes headers for hx-get form', function(){
      const form = make(`
        <form hx-get="/test" preload>
          <input type="text" name="name" value="John">
          <input type="submit" value="Submit">
        </form>
      `)
      const submitButton = form.querySelector("input[type='submit']")
  
      htmx.trigger(submitButton, 'mousedown')
      this.server.respond()
      submitButton.click()

      should.equal(requests.length, 2)
      should.equal(requests[0].url, requests[1].url)
      should.equal(requests[0].method, requests[1].method)
      requests[0].requestHeaders.should.deep.contain(requests[1].requestHeaders)
    })

    it('matches url and includes headers for checkbox label in a form with multiple fields', function(){
      const form = make(`
        <form hx-get="/test" hx-trigger="change" preload="mouseover">
          <div>
            <input type="text" name="name" value="John">
          </div>
          <div>
            <input type="checkbox" id="coding_checkbox" name="interests" value="Coding" checked>
            <label for="coding_checkbox">Coding</label>
            <input type="checkbox" id="music_checkbox" name="interests" value="Music">
            <label for="music_checkbox">Music</label>
            <input type="checkbox" id="sports_checkbox" name="interests" value="Sports" checked>
            <label for="sports_checkbox">Sports</label>
          </div>
          <div>
            <input type="radio" name="card_type" value="Visa" checked> Visa
            <input type="radio" name="card_type" value="Mastercard"> Mastercard
          </div>
        </form>
      `)
      const sportsCheckboxLabel = form.querySelector("label[for='sports_checkbox']")

      htmx.trigger(sportsCheckboxLabel, "mouseover")
      this.clock.tick(100)
      this.server.respond()
      sportsCheckboxLabel.click()

      should.equal(requests.length, 2)
      should.equal(requests[0].url, requests[1].url)
      should.equal(requests[0].method, requests[1].method)
      requests[0].requestHeaders.should.deep.contain(requests[1].requestHeaders)
    })

    it('does not include HX-Preloaded header when clicking hx-boosted and preloaded hyperlink', function() {
      const hyperlink = make('<a href="/test" hx-boost="true" preload>Link</a>')
  
      hyperlink.click()
      
      should.equal(requests.length, 1)
      requests[0].requestHeaders.should.not.deep.contain({"HX-Preloaded": "true"})
    })
  })
  