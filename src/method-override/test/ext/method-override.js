describe('method-override extension', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('issues a DELETE request with proper headers', function() {
    this.server.respondWith('DELETE', '/test', function(xhr) {
      xhr.requestHeaders['X-HTTP-Method-Override'].should.equal('DELETE')
      xhr.method.should.equal('POST')
      xhr.respond(200, {}, 'Deleted!')
    })

    var btn = make('<button hx-ext="method-override" hx-delete="/test">Click Me!</button>')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Deleted!')
  })

  it('issues a PATCH request with proper headers', function() {
    this.server.respondWith('PATCH', '/test', function(xhr) {
      xhr.requestHeaders['X-HTTP-Method-Override'].should.equal('PATCH')
      xhr.method.should.equal('POST')
      xhr.respond(200, {}, 'Patched!')
    })

    var btn = make('<button hx-ext="method-override" hx-patch="/test">Click Me!</button>')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Patched!')
  })

  it('issues a PUT request with proper headers', function() {
    this.server.respondWith('PUT', '/test', function(xhr) {
      xhr.requestHeaders['X-HTTP-Method-Override'].should.equal('PUT')
      xhr.method.should.equal('POST')
      xhr.respond(200, {}, 'Putted!')
    })

    var btn = make('<button hx-ext="method-override" hx-put="/test">Click Me!</button>')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Putted!')
  })

  it('issues a GET request with proper headers', function() {
    this.server.respondWith('GET', '/test', function(xhr) {
      should.not.exist(xhr.requestHeaders['X-HTTP-Method-Override'])
      xhr.method.should.equal('GET')
      xhr.respond(200, {}, 'Getted!')
    })

    var btn = make('<button hx-ext="method-override" hx-get="/test">Click Me!</button>')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Getted!')
  })

  it('issues a POST request with proper headers', function() {
    this.server.respondWith('POST', '/test', function(xhr) {
      should.not.exist(xhr.requestHeaders['X-HTTP-Method-Override'])
      xhr.method.should.equal('POST')
      xhr.respond(200, {}, 'Posted!')
    })

    var btn = make('<button hx-ext="method-override" hx-post="/test">Click Me!</button>')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Posted!')
  })
})
