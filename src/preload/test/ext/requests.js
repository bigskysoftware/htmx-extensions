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

    it('matches request for hx-boosted hyperlink to the request when hyperlink is clicked', function() {
      const hyperlink = make('<a href="/test" hx-boost="true" preload>Link</a>')
  
      htmx.trigger(hyperlink, 'mousedown')
      this.server.respond()
      hyperlink.click()
      
      should.equal(requests.length, 2)
      should.equal(requests[0].url, requests[1].url)
      should.equal(requests[0].method, requests[1].method)
      requests[0].requestHeaders.should.deep.equal(requests[1].requestHeaders)
    })

    it('matches request for hx-boosted form to the request when form is submitted', function(){
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
      requests[0].requestHeaders.should.deep.equal(requests[1].requestHeaders)
    })

    it('matches request for hx-get button to the request when button is clicked', function() {
      const button = make('<button hx-get="/test" preload>Button</button>')
  
      htmx.trigger(button, 'mousedown')
      this.server.respond()
      button.click()
      
      should.equal(requests.length, 2)
      should.equal(requests[0].url, requests[1].url)
      should.equal(requests[0].method, requests[1].method)
      requests[0].requestHeaders.should.deep.equal(requests[1].requestHeaders)
    })

    it('matches request for hx-get form to the request when form is submitted', function(){
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
      requests[0].requestHeaders.should.deep.equal(requests[1].requestHeaders)
    })

    it('matches request for checkbox label in a form with multiple fields to the request when label is clicked', function(){
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
      requests[0].requestHeaders.should.deep.equal(requests[1].requestHeaders)
    })
  })
  