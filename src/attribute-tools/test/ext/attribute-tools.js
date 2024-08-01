describe('attribute-tools extension', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('adds blank attribute properly', function(done) {
    var div = make('<div hx-ext="attribute-tools" attributes="set c1">Click Me!</div>')
    should.equal(div.hasAttribute('c1'), false)
    
    setTimeout(function() {
      should.equal(div.hasAttribute('c1'), true)
      done()
    }, 100)
  })

  it('adds multiple blank attributes properly', function(done) {
    var div = make('<div hx-ext="attribute-tools" attributes="set c1, set c2, set c3">Click Me!</div>')
    should.equal(div.hasAttribute('c1'), false)
    should.equal(div.hasAttribute('c2'), false)
    should.equal(div.hasAttribute('c3'), false)
    
    setTimeout(function() {
      should.equal(div.hasAttribute('c1'), true)
      should.equal(div.hasAttribute('c2'), true)
      should.equal(div.hasAttribute('c3'), true)
      done()
    }, 100)
  })

  it('adds defined attribute properly', function(done) {
    var div = make('<div hx-ext="attribute-tools" attributes="set at1=val1">Click Me!</div>')
    should.equal(div.hasAttribute('at1'), false)
    
    setTimeout(function() {
      should.equal(div.getAttribute('at1'), 'val1')
      done()
    }, 100)
  })

  it('adds defined attribute after 1s properly', function(done) {
    var div = make('<div hx-ext="attribute-tools" attributes="set at1=val1:1s">Click Me!</div>')
    should.equal(div.hasAttribute('at1'), false)
    
    setTimeout(function() {
      should.equal(div.hasAttribute('at1'), false)
      
      setTimeout(function() {
        should.equal(div.getAttribute('at1'), 'val1')
        
        done()
      }, 1100)
    }, 100)
  })

  it('remove attribute after 1s properly', function(done) {
    var div = make('<div hx-ext="attribute-tools" at1="val1" attributes="remove at1:1s">Click Me!</div>')
    
    setTimeout(function() {
      should.equal(div.getAttribute('at1'), 'val1')
      
      setTimeout(function() {
      should.equal(div.hasAttribute('at1'), false)
        
        done()
      }, 1100)
    }, 100)
  })
  
  it('adds multiple defined attributes properly', function(done) {
    var div = make('<div hx-ext="attribute-tools" attributes="set at1=val1, set at2=val2">Click Me!</div>')
    should.equal(div.hasAttribute('at1'), false)
    should.equal(div.hasAttribute('at2'), false)
    
    setTimeout(function() {
      should.equal(div.getAttribute('at1'), 'val1')
      should.equal(div.getAttribute('at2'), 'val2')
      done()
    }, 100)
  })

  it('set and remove attributes at same time properly', function(done) {
    var div = make('<div hx-ext="attribute-tools" bt1="bval1" bt2="bval2" bt3="bval3" bt4="bval4" attributes="set bt1=bval1-new, set bt2=bval2-new, remove bt4">Click Me!</div>')
      should.equal(div.getAttribute('bt1'), 'bval1')
      should.equal(div.getAttribute('bt2'), 'bval2')
      should.equal(div.getAttribute('bt3'), 'bval3')
      should.equal(div.getAttribute('bt4'), 'bval4')
    
    setTimeout(function() {
      should.equal(div.getAttribute('bt1'), 'bval1-new')
      should.equal(div.getAttribute('bt2'), 'bval2-new')
      should.equal(div.getAttribute('bt3'), 'bval3')
      should.equal(div.hasAttribute('bt4'), false)
      done()
    }, 100)
  })

  it('removes attributes properly', function(done) {
    var div = make('<div hx-ext="attribute-tools" ct1="cval1" ct2="cval2" ct3 ct4 attributes="remove ct1, remove ct3">Click Me!</div>')
    should.equal(div.getAttribute('ct1'), 'cval1')
    should.equal(div.getAttribute('ct2'), 'cval2')
    should.equal(div.hasAttribute('ct3'), true)
    should.equal(div.hasAttribute('ct4'), true)

    setTimeout(function() {
      should.equal(div.hasAttribute('ct1'), false)
      should.equal(div.getAttribute('ct2'), 'cval2')
      should.equal(div.hasAttribute('ct3'), false)
      should.equal(div.hasAttribute('ct4'), true)

      done()
    }, 100)
  })

  it('updates attributes properly w/ data-* prefix', function(done) {
    var div = make('<div hx-ext="attribute-tools" bt1="bval1" bt2="bval2" bt3="bval3" data-attributes="set bt1=bval1-new, set bt2=bval2-new">Click Me!</div>')
      should.equal(div.getAttribute('bt1'), 'bval1')
      should.equal(div.getAttribute('bt2'), 'bval2')
      should.equal(div.getAttribute('bt3'), 'bval3')
    
    setTimeout(function() {
      should.equal(div.getAttribute('bt1'), 'bval1-new')
      should.equal(div.getAttribute('bt2'), 'bval2-new')
      should.equal(div.getAttribute('bt3'), 'bval3')
      done()
    }, 100)
  })

  it('updates attributes on parent properly', function(done) {
    var div = make('<div bt1="bval1" bt2="bval2" bt3="bval3">Click Me!<div hx-ext="attribute-tools" apply-parent-attributes="set bt1=bval1-new, set bt2=bval2-new"></div></div>')
      should.equal(div.getAttribute('bt1'), 'bval1')
      should.equal(div.getAttribute('bt2'), 'bval2')
      should.equal(div.getAttribute('bt3'), 'bval3')
    
    setTimeout(function() {
      should.equal(div.getAttribute('bt1'), 'bval1-new')
      should.equal(div.getAttribute('bt2'), 'bval2-new')
      should.equal(div.getAttribute('bt3'), 'bval3')
      done()
    }, 100)
  })

  it('removes attributes from parent properly', function(done) {
    var div = make('<div ct1="cval1" ct2="cval2" ct3 ct4>Click Me!<div hx-ext="attribute-tools" apply-parent-attributes="remove ct1, remove ct3"></div></div>')
    should.equal(div.getAttribute('ct1'), 'cval1')
    should.equal(div.getAttribute('ct2'), 'cval2')
    should.equal(div.hasAttribute('ct3'), true)
    should.equal(div.hasAttribute('ct4'), true)

    setTimeout(function() {
      should.equal(div.hasAttribute('ct1'), false)
      should.equal(div.getAttribute('ct2'), 'cval2')
      should.equal(div.hasAttribute('ct3'), false)
      should.equal(div.hasAttribute('ct4'), true)

      done()
    }, 100)
  })
  
  
  it('cleans up child with apply-parent-attributes :1s properly', function(done) {
    var div = make('<div bar="baz">Click Me!<div id="d2" hx-ext="attribute-tools" apply-parent-attributes="remove bar:1s"></div></div>')
    setTimeout(function() {
      should.equal(div.hasAttribute('bar'), true)
      should.not.exist(byId('d2'))
      
      setTimeout(function() {
        should.equal(div.hasAttribute('bar'), false)
        done()
      }, 1100)
    }, 100)
  })

  it('extension can be on parent', function(done) {
    var div = make('<div hx-ext="attribute-tools"><div id="d1" attributes="set at1=val1">Click Me!</div></div>')
    should.equal(div.hasAttribute('at1'), false)
    
    setTimeout(function() {
      should.equal(byId('d1').getAttribute('at1'), 'val1')
      done()
    }, 100)
  })
})
