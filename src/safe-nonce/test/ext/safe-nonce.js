describe('safe-nonce extension tests', function() {
  const chai = window.chai
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('style with inlineStyleNonce set applies when CSP header set', function() {
    // Note that it is hard to test the htmx inline indicator styles directly so create a testable style in head instead
    const nonceAttribute = htmx.config.inlineStyleNonce ? ` nonce="${htmx.config.inlineStyleNonce}"` : ''
    document.head.insertAdjacentHTML('beforeend', '<style' + nonceAttribute + '>.width-nonce{ width:150px;}</style>')
    var div = make('<div id="d1" class="width-nonce" hx-get="/test"/>')
    div.clientWidth.should.equal(150)
  })

  it('style without inlineStyleNonce fails to apply when CSP header set', function() {
    document.head.insertAdjacentHTML('beforeend', '<style>.width-no-nonce{ width:150px;}</style>')
    var div = make('<div id="d1" class="width-no-nonce" hx-get="/test"/>')
    div.clientWidth.should.not.equal(150)
  })

  it('inlineScriptNonce sets nonce of script so it can run when CSP script nonce set', function(done) {
    // Note inlineScriptNonce and CSP configured in index.html which applies to all tests
    window.i = 0 // set count to 0
    this.server.respondWith('GET', '/test', '<script nonce="shouldBeReplaced">console.trace(); window.i++</script>') // increment the count by 1
    var div = make('<div hx-get="/test" hx-swap="innerHTML settle:5ms"/>')
    div.click()
    this.server.respond()

    setTimeout(function() {
      window.i.should.equal(1)
      delete window.i
      done()
    }, 50)
  })

  it('inlineScriptNonce not set prevents inline scripts running because it will not match CSP', function(done) {
    window.i = 0 // set count to 0
    this.server.respondWith('GET', '/test', '<script nonce="shouldBeReplaced">console.trace(); window.i++</script>') // fail to increment the count by 1
    htmx.config.inlineScriptNonce = '' // disable inlineScriptNonce
    var div = make('<div hx-get="/test" hx-swap="innerHTML settle:5ms"/>')
    div.click()
    this.server.respond()

    setTimeout(function() {
      window.i.should.equal(0)
      delete window.i
      htmx.config.inlineScriptNonce = 'nonce'
      done()
    }, 50)
  })

  it('inlineScriptNonce set wrong prevents inline scripts running because it will not match CSP', function(done) {
    window.i = 0 // set count to 0
    this.server.respondWith('GET', '/test', '<script nonce="shouldBeReplaced">console.trace(); window.i++</script>') // fail to increment the count by 1
    htmx.config.inlineScriptNonce = 'invalid' // make inlineScriptNonce invalid
    var div = make('<div hx-get="/test" hx-swap="innerHTML settle:5ms"/>')
    div.click()
    this.server.respond()

    setTimeout(function() {
      window.i.should.equal(0)
      delete window.i
      htmx.config.inlineScriptNonce = 'nonce'
      done()
    }, 50)
  })

  it('safe-nonce enabled and HX-Nonce header match script nonce allows inline scripts to run', function(done) {
    // safe-nonce overrides inlineScriptNonce function and requires the server to respond with HX-Nonce header instead
    window.i = 0 // set count to 0
    this.server.respondWith('GET', '/test', [200, { 'HX-Nonce': '6p1zabP/K+va3O8bi2yydg==' }, '<script nonce="6p1zabP/K+va3O8bi2yydg==">console.trace(); window.i++</script>'])
    htmx.config.safeInlineScriptNonce = 'nonce'
    var div = make('<div hx-ext="safe-nonce" hx-get="/test" hx-swap="innerHTML settle:5ms"/>')
    div.click()
    this.server.respond()

    setTimeout(function() {
      window.i.should.equal(1)
      delete window.i
      done()
    }, 50)
  })

  it('safe-nonce enabled but inlineScriptNonce set wrong blocks inline scripts running', function(done) {
    window.i = 0 // set count to 0
    this.server.respondWith('GET', '/test', [200, { 'HX-Nonce': '6p1zabP/K+va3O8bi2yydg==' }, '<script nonce="6p1zabP/K+va3O8bi2yydg==">console.trace(); window.i++</script>'])
    htmx.config.safeInlineScriptNonce = 'invalid' // When set to an invalid value expect inline scripts to fail
    var div = make('<div hx-ext="safe-nonce" hx-get="/test" hx-swap="innerHTML settle:5ms"/>')
    div.click()
    this.server.respond()

    setTimeout(function() {
      window.i.should.equal(0)
      delete window.i
      done()
    }, 50)
  })

  it('safe-nonce enabled but HX-Nonce header does not match script nonce will block inline scripts', function(done) {
    window.i = 0 // set count to 0
    this.server.respondWith('GET', '/test', [200, { 'HX-Nonce': '6p1zabP/K+va3O8bi2yydg==' }, '<script nonce="invalid">console.trace(); window.i++</script>'])
    htmx.config.safeInlineScriptNonce = 'nonce'
    var div = make('<div hx-ext="safe-nonce" hx-get="/test" hx-swap="innerHTML settle:5ms"/>')
    div.click()
    this.server.respond()

    setTimeout(function() {
      window.i.should.equal(0)
      delete window.i
      done()
    }, 50)
  })

  it('safe-nonce enabled but HX-Nonce header not set will block inline scripts', function(done) {
    window.i = 0 // set count to 0
    this.server.respondWith('GET', '/test', [200, {}, '<script nonce="6p1zabP/K+va3O8bi2yydg==">console.trace(); window.i++</script>'])
    htmx.config.safeInlineScriptNonce = 'nonce'
    var div = make('<div hx-ext="safe-nonce" hx-get="/test" hx-swap="innerHTML settle:5ms"/>')
    div.click()
    this.server.respond()

    setTimeout(function() {
      window.i.should.equal(0)
      delete window.i
      done()
    }, 50)
  })

  it('reuse of original page load nonce in scripts blocked', function(done) {
    window.i = 0 // set count to 0
    this.server.respondWith('GET', '/test', [200, {}, '<script nonce="nonce">console.trace(); window.i++</script>'])
    htmx.config.safeInlineScriptNonce = 'nonce'
    var div = make('<div hx-ext="safe-nonce" hx-get="/test" hx-swap="innerHTML settle:5ms"/>')
    div.click()
    this.server.respond()

    setTimeout(function() {
      window.i.should.equal(0)
      delete window.i
      done()
    }, 50)
  })
})