describe('class-tools extension', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('adds classes properly', function(done) {
    var div = make('<div hx-ext="class-tools" classes="add c1">Click Me!</div>')
    should.equal(div.classList.length, 0)
    setTimeout(function() {
      should.equal(div.classList.contains('c1'), true)
      done()
    }, 100)
  })

  it('removes classes properly', function(done) {
    var div = make('<div class="foo bar" hx-ext="class-tools" classes="remove bar">Click Me!</div>')
    should.equal(div.classList.contains('foo'), true)
    should.equal(div.classList.contains('bar'), true)
    setTimeout(function() {
      should.equal(div.classList.contains('foo'), true)
      should.equal(div.classList.contains('bar'), false)
      done()
    }, 100)
  })

  it('adds classes properly w/ data-* prefix', function(done) {
    var div = make('<div hx-ext="class-tools" data-classes="add c1">Click Me!</div>')
    should.equal(div.classList.length, 0)
    setTimeout(function() {
      should.equal(div.classList.contains('c1'), true)
      done()
    }, 100)
  })

  it('adds classes to parent properly', function(done) {
    var div = make('<div>Click Me!<div hx-ext="class-tools" apply-parent-classes="add c1"></div></div>')
    should.equal(div.classList.length, 0)
    setTimeout(function() {
      should.equal(div.classList.contains('c1'), true)
      done()
    }, 100)
  })

  it('removes classes from parent properly', function(done) {
    var div = make('<div class="foo bar">Click Me!<div hx-ext="class-tools" apply-parent-classes="remove bar"></div></div>')
    should.equal(div.classList.contains('foo'), true)
    should.equal(div.classList.contains('bar'), true)
    setTimeout(function() {
      should.equal(div.classList.contains('foo'), true)
      should.equal(div.classList.contains('bar'), false)
      done()
    }, 100)
  })

  it('cleans up child with apply-parent-classes properly', function(done) {
    var div = make('<div class="foo bar">Click Me!<div id="d2" hx-ext="class-tools" apply-parent-classes="remove bar"></div></div>')
    setTimeout(function() {
      should.not.exist(byId('d2'))
      done()
    }, 100)
  })

  it('extension can be on parent', function(done) {
    var div = make('<div hx-ext="class-tools"><div id="d1" classes="add c1">Click Me!</div></div>')
    should.equal(div.classList.length, 0)
    setTimeout(function() {
      should.equal(div.classList.contains('c1'), false)
      should.equal(byId('d1').classList.contains('c1'), true)
      done()
    }, 100)
  })

  it('does not add classes if event is not triggered', function(done) {
    var div = make('<div hx-ext="class-tools"><div classes="add foo"  classes-event-trigger="my-custom-event">Test</div></div>')
    should.equal(div.classList.contains('foo'), false)
    setTimeout(function() {
      should.equal(div.classList.contains('foo'), false)
      done()
    }, 100)
  })

  it('toggles classes properly on custom event trigger, class set', function(done) {
    var div = make(`
      <div hx-ext="class-tools">
        <div classes="toggle foo:!" classes-event-trigger="my-custom-event">Test</div>
        <button hx-on-click="htmx.trigger('body', 'my-custom-event')">toggle</button>
      </div>
    `)
    var toggleDiv = div.querySelector('[classes]')
    should.equal(toggleDiv.classList.contains('foo'), false)
    var button = div.querySelector('button')
    button.click()
    setTimeout(function() {
      should.equal(toggleDiv.classList.contains('foo'), true)
      done()
    }, 100)
  })

  it('toggles classes properly on custom event trigger, class unset', function(done) {
    var div = make(`
      <div hx-ext="class-tools">
        <div class="foo" classes="toggle foo:!" classes-event-trigger="my-custom-event">Test</div>
        <button hx-on-click="htmx.trigger('body', 'my-custom-event')">toggle</button>
      </div>
    `)
    var toggleDiv = div.querySelector('[classes]')
    should.equal(toggleDiv.classList.contains('foo'), true)
    var button = div.querySelector('button')
    button.click()
    setTimeout(function() {
      should.equal(toggleDiv.classList.contains('foo'), false)
      done()
    }, 100)
  })

  it('toggles classes properly on multiple elements with custom event', function(done) {
    var container = make(`
      <div hx-ext="class-tools">
        <div id="div1" classes="toggle foo:!" classes-event-trigger="my-custom-event">Test 1</div>
        <div id="div2" classes="toggle bar:!" classes-event-trigger="my-custom-event">Test 2</div>
        <button hx-on-click="htmx.trigger('body', 'my-custom-event')">Toggle Classes</button>
      </div>
    `)
    var div1 = container.querySelector('#div1')
    var div2 = container.querySelector('#div2')
    should.equal(div1.classList.contains('foo'), false)
    should.equal(div2.classList.contains('bar'), false)
    var button = container.querySelector('button')
    button.click()
    setTimeout(function() {
      should.equal(div1.classList.contains('foo'), true)
      should.equal(div2.classList.contains('bar'), true)
      done()
    }, 100)
  })
  
  it('toggles multiple classes properly on custom event trigger', function(done) {
    var div = make(`
      <div hx-ext="class-tools">
        <div classes="toggle foo:!, toggle bar:!" classes-event-trigger="my-custom-event">Test</div>
        <button hx-on-click="htmx.trigger('body', 'my-custom-event')">toggle</button>
      </div>
    `)
    var toggleDiv = div.querySelector('[classes]')
    should.equal(toggleDiv.classList.contains('foo'), false)
    should.equal(toggleDiv.classList.contains('bar'), false)
    var button = div.querySelector('button')
    button.click()
    setTimeout(function() {
      should.equal(toggleDiv.classList.contains('foo'), true)
      should.equal(toggleDiv.classList.contains('bar'), true)
      done()
    }, 100)
  })
 
  // add
})
