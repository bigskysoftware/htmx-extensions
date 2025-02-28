describe('preload extension preloads forms', function() {
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
  
    it('preloads form with method="get" and preload attribute', function() {
      const form = make(`
        <form action="/test" method="get" preload>
          <input type="text" name="name" value="John">
          <input type="submit" value="Submit">
        </form>
      `)
      const submitButton = form.querySelector("input[type='submit']")
  
      htmx.trigger(submitButton, 'mousedown')
  
      should.equal(requests.length, 1)
      should.equal(requests[0].url, '/test?name=John')
    })
  
    it('preloads form with hx-get and preload attribute', function() {
      const form = make(`
        <form hx-get="/test" preload>
          <input type="text" name="name" value="John">
          <input type="submit" value="Submit">
        </form>
      `)
      const submitButton = form.querySelector("input[type='submit']")
  
      htmx.trigger(submitButton, 'mousedown')
  
      should.equal(requests.length, 1)
      should.equal(requests[0].url, '/test?name=John')
    })

    it('does not preload form with method="post" and preload attribute', function() {
      const form = make(`
        <form action="/test" method="post" preload>
          <input type="text" name="name" value="John">
          <input type="submit" value="Submit">
        </form>
      `)
      const submitButton = form.querySelector("input[type='submit']")
  
      htmx.trigger(submitButton, 'mousedown')
  
      should.equal(requests.length, 0)
    })

    it('does not preload form with hx-post and preload attribute', function() {
      const form = make(`
        <form hx-post="/test" preload>
          <input type="text" name="name" value="John">
          <input type="submit" value="Submit">
        </form>
      `)
      const submitButton = form.querySelector("input[type='submit']")
  
      htmx.trigger(submitButton, 'mousedown')
  
      should.equal(requests.length, 0)
    })

    it('preloads <button type="submit">', function() {
      const form = make(`
        <form hx-get="/test" preload>
          <input type="text" name="name" value="John">
          <button type="submit" value="Submit">Submit</button>
        </form>
      `)
      const submitButton = form.querySelector("button[type='submit']")
  
      htmx.trigger(submitButton, 'mousedown')
  
      should.equal(requests.length, 1)
      should.equal(requests[0].url, '/test?name=John')
    })

    it('preloads radio button inheriting preload from parent form', function() {
      const form = make(`
        <form hx-get="/test" preload="mouseover">
          <input type="radio" name="card_type" value="Visa"> Visa
          <input type="radio" name="card_type" value="Mastercard"> Mastercard
        </form>
      `)
      const visaRadioButton = form.querySelector("input[value='Visa']")

      htmx.trigger(visaRadioButton, 'mouseover')
      this.clock.tick(100)

      should.equal(requests.length, 1)
      should.equal(requests[0].url, '/test?card_type=Visa')
    })

    it('preloads radio button with preload tag', function() {
      const form = make(`
        <form hx-get="/test">
          <input type="radio" name="card_type" value="Visa" preload="mouseover"> Visa
          <input type="radio" name="card_type" value="Mastercard"> Mastercard
        </form>
      `)
      const visaRadioButton = form.querySelector("input[value='Visa']")

      htmx.trigger(visaRadioButton, 'mouseover')
      this.clock.tick(100)

      should.equal(requests.length, 1)
      should.equal(requests[0].url, '/test?card_type=Visa')
    })

    it('does not preload radio button without preload tag', function() {
      const form = make(`
        <form hx-get="/test">
          <input type="radio" name="card_type" value="Visa" preload="mouseover"> Visa
          <input type="radio" name="card_type" value="Mastercard"> Mastercard
        </form>
      `)
      const mastercardRadioButton = form.querySelector("input[value='Mastercard']")

      htmx.trigger(mastercardRadioButton, 'mouseover')
      this.clock.tick(100)

      should.equal(requests.length, 0)
    })

    it('preloads label containing radio button', function() {
      const form = make(`
        <form hx-get="/test" preload="mouseover">
          <label><input type="radio" name="card_type" value="Visa"> Visa</label>
          <label><input type="radio" name="card_type" value="Mastercard"> Mastercard</label>
        </form>
      `)
      const visaRadioLabel = form.querySelector("label:has(input[value='Visa'])")

      htmx.trigger(visaRadioLabel, 'mouseover')
      this.clock.tick(100)

      should.equal(requests.length, 1)
      should.equal(requests[0].url, '/test?card_type=Visa')
    })

    it('preloads unchecked checkbox', function() {
      const form = make(`
        <form hx-get="/test" preload="mouseover">
          <input type="checkbox" name="interests" value="Coding" checked> Coding
          <input type="checkbox" name="interests" value="Music"> Music
          <input type="checkbox" name="interests" value="Sports" checked> Sports
        </form>
      `)
      const musicCheckbox = form.querySelector("input[value='Music']")

      htmx.trigger(musicCheckbox, 'mouseover')
      this.clock.tick(100)

      should.equal(requests.length, 1)
      should.equal(requests[0].url, '/test?interests=Coding&interests=Music&interests=Sports')
    })

    it('preloads checked checkbox', function() {
      const form = make(`
        <form hx-get="/test" preload="mouseover">
          <input type="checkbox" name="interests" value="Coding" checked> Coding
          <input type="checkbox" name="interests" value="Music"> Music
          <input type="checkbox" name="interests" value="Sports" checked> Sports
        </form>
      `)
      const sportsCheckbox = form.querySelector("input[value='Sports']")

      htmx.trigger(sportsCheckbox, 'mouseover')
      this.clock.tick(100)

      should.equal(requests.length, 1)
      should.equal(requests[0].url, '/test?interests=Coding')
    })

    it('preloads label bound to checked checkbox', function() {
      const form = make(`
        <form hx-get="/test" preload="mouseover">
          <input type="checkbox" id="coding_checkbox" name="interests" value="Coding" checked>
          <label for="coding_checkbox">Coding</label>
          <input type="checkbox" id="music_checkbox" name="interests" value="Music">
          <label for="music_checkbox">Music</label>
          <input type="checkbox" id="sports_checkbox" name="interests" value="Sports" checked>
          <label for="sports_checkbox">Sports</label>
        </form>
      `)
      const sportsCheckboxLabel = form.querySelector("label[for='sports_checkbox']")

      htmx.trigger(sportsCheckboxLabel, 'mouseover')
      this.clock.tick(100)

      should.equal(requests.length, 1)
      should.equal(requests[0].url, '/test?interests=Coding')
    })

    it('preloads unselected select options', function() {
      const form = make(`
        <form hx-get="/test" preload>
          <select name="pet">
            <option value="dog" selected>Dog</option>
            <option value="cat">Cat</option>
            <option value="dinosaur">Dinosaur</option>
          </select>
        </form>
      `)
      const select = form.querySelector("select")

      htmx.trigger(select, 'mousedown')
      this.server.respond()

      should.equal(requests.length, 2)
      should.equal(requests[0].url, '/test?pet=cat')
      should.equal(requests[1].url, '/test?pet=dinosaur')
    })

    it('sends only one preload request when activating input contained in a label', function() {
      const form = make(`
        <form hx-get="/test" preload="mouseover">
          <label><input type="radio" name="card_type" value="Visa"> Visa</label>
        </form>
      `)
      const visaRadio = form.querySelector("input[value='Visa']")

      htmx.trigger(visaRadio, 'mouseover')
      this.clock.tick(100)

      should.equal(requests.length, 1)
    })

    it('skips label initialisation for fieldsets (issue 149)', function() {
      const form = make(`
        <form action="/test" method="get" preload>
	  <fieldset>
            <input type="text" name="name" value="John">
	  </fieldset>
          <input type="submit" value="Submit">
        </form>
      `)
      const submitButton = form.querySelector("input[type='submit']")

      htmx.trigger(submitButton, 'mousedown')

      should.equal(requests.length, 1)
      should.equal(requests[0].url, '/test?name=John')
    })
  })
