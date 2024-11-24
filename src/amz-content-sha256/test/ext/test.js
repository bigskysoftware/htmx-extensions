describe("Create a hash from a request", function () {
  beforeEach(function () {
    this.server = makeServer();
    clearWorkArea();
  });
  afterEach(function () {
    this.server.restore();
    clearWorkArea();
  });

  it("Should hash the request if it is a post", async function () {
    this.server.respondWith("POST", "/test", function (xhr) {
      xhr.respond(
        200,
        {},
        JSON.stringify({ hash: xhr.requestHeaders["x-amz-content-sha256"] })
      );
    });

    var html = make(
      '<form hx-post="/test" hx-ext="amz-content-sha256" > ' +
        '<input type="text"  name="email" value="email@email.com"> ' +
        '<input type="password"  name="password" value="123456"> ' +
        '<button  id="btnSubmit">Submit</button> '
    );

    byId("btnSubmit").click();
    // Await for async crypto hash function
    await new Promise((res) => setTimeout(res, 100));
    this.server.respond();
    this.server.lastRequest.response.should.equal(
      '{"hash":"9e2fbbb1b4b2e1cabd1923ec1376ab3c57b904820101b6edccf1a2c1adc20faf"}' // Hash for this first form data
    );
  });

  it("Should hash the request if it is a put", async function () {
    this.server.respondWith("PUT", "/test", function (xhr) {
      xhr.respond(
        200,
        {},
        JSON.stringify({ hash: xhr.requestHeaders["x-amz-content-sha256"] })
      );
    });

    var html = make(
      '<form hx-put="/test" hx-ext="amz-content-sha256" > ' +
        '<input type="text"  name="email" value="email2@email.com"> ' +
        '<input type="password"  name="password" value="123456"> ' +
        '<button  id="btnSubmit">Submit</button> '
    );

    byId("btnSubmit").click();
    // Await for async crypto hash function
    await new Promise((res) => setTimeout(res, 100));
    this.server.respond();
    this.server.lastRequest.response.should.equal(
      '{"hash":"31b0fe62efaa67d156b565b8d5221c3e7fdf2201f52f9adcd955d36614c65f59"}' // Hash for this first form data
    );
  });

  it("Should not send a hash if there is no form element", async function () {
    this.server.respondWith("POST", "/test", function (xhr) {
      const hashNotSend =
        xhr.requestHeaders["x-amz-content-sha256"] == undefined;
      xhr.respond(
        200,
        {},
        JSON.stringify({
          hashNotSend,
          hash: xhr.requestHeaders["x-amz-content-sha256"],
        })
      );
    });

    var html = make(
      '<button hx-post="/test" hx-ext="amz-content-sha256"  id="btnSubmit">Submit</button> '
    );

    byId("btnSubmit").click();
    // Await for async crypto hash function
    await new Promise((res) => setTimeout(res, 100));
    this.server.respond();
    this.server.lastRequest.response.should.equal(
      '{"hashNotSend":true}' // Hash for this first form data
    );
  });
});
