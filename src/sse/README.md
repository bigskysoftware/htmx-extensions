# htmx-ext-sse — Server Sent Events extension

The canonical documentation lives at <https://htmx.org/extensions/sse> (source: <https://github.com/bigskysoftware/htmx/blob/master/www/content/extensions/sse.md>).

This page documents extension features that go beyond the canonical reference, in particular how to configure the SSE connection (set query parameters from `hx-vals`, override the URL, send Authorization headers, perform a `POST` connection via an `EventSource` polyfill, etc.).

## Configuring the connection

### Sending `hx-vals` as query parameters

Any values declared on the connecting element through [`hx-vals`](https://htmx.org/attributes/hx-vals/) (or `hx-vars`) are automatically URL-encoded and appended to the `sse-connect` URL as query parameters before the `EventSource` is opened. Existing query strings on the URL are preserved.

```html
<div hx-ext="sse"
     sse-connect="/events"
     hx-vals='{"room": "lobby", "token": "abc123"}'>
  ...
</div>
```

Opens an `EventSource` against `/events?room=lobby&token=abc123`.

### The `htmx:sseConfigConnect` event

Right before the extension calls `htmx.createEventSource(url, options)` it fires a cancelable `htmx:sseConfigConnect` event on the element. The event's `detail` object lets you inspect and override everything about the connection:

| `detail` property | Description |
| --- | --- |
| `url` | The fully-built URL (including any appended `hx-vals`). Mutate to change. |
| `options` | The object passed as the second argument to the `EventSource` constructor. Defaults to `{ withCredentials: true }`. |
| `parameters` | The plain object of `hx-vals` / `hx-vars` collected from the element. |
| `headers` | The standard htmx headers object (as produced by the internal `getHeaders` API). |
| `elt` | The element that initiated the connection. |

Calling `event.preventDefault()` aborts the connection entirely; this is useful when, for example, you want to wait for an auth token before opening the stream.

```javascript
document.body.addEventListener('htmx:sseConfigConnect', function (evt) {
  // Add a dynamic query parameter
  evt.detail.url += (evt.detail.url.includes('?') ? '&' : '?') + 'tab=' + activeTab()
  // Disable credentials for this particular connection
  evt.detail.options.withCredentials = false
})
```

## Using a custom `EventSource` (and sending Authorization headers / POST bodies)

The native browser `EventSource` does **not** support custom request headers, custom HTTP methods, or request bodies. To enable those things — for example to send an `Authorization: Bearer …` header, or to `POST` a payload to start the stream — you can drop in a polyfill that mimics the `EventSource` API. A widely used one is [`sse.js`](https://github.com/mpetazzoni/sse.js) by Maxime Petazzoni.

The extension exposes two seams that make this completely transparent:

1. `htmx.createEventSource(url, options)` is a function on the global `htmx` object that the extension uses to construct every connection. Replace it with your own factory to use any EventSource-shaped object you like.
2. The `options` argument is whatever you put into `evt.detail.options` from a `htmx:sseConfigConnect` handler (defaulting to `{ withCredentials: true }`). Polyfills such as `sse.js` accept extra keys here — `method`, `headers`, `payload`, `start`, etc.

### Step-by-step: send Authorization headers with a POST SSE connection

> The example below assumes you've loaded `sse.js` (e.g. `<script src="https://cdn.jsdelivr.net/npm/sse.js@2/lib/sse.min.js"></script>`) so that the global `SSE` constructor is available.

1. **Load `sse.js` before the htmx SSE extension.** The extension reads `htmx.createEventSource` lazily on every connection, so the order matters only for the override step below — but loading `sse.js` first is the simplest setup.

2. **Tell htmx to use `SSE` instead of the built-in `EventSource`.** `sse.js` exposes its constructor as both `SSE` and `EventSource` (you can also globally replace `window.EventSource = SSE` per the `sse.js` README, but the explicit override below is safer because it only affects htmx and keeps any other code using the real `EventSource`):

    ```javascript
    htmx.createEventSource = function (url, options) {
      // `options` is the object that the SSE extension built and that any
      // htmx:sseConfigConnect handler may have customized.
      return new SSE(url, options)
    }
    ```

3. **Use a `htmx:sseConfigConnect` listener to fill in the headers / method / payload.** Anything you put on `evt.detail.options` will reach the constructor above.

    ```javascript
    document.body.addEventListener('htmx:sseConfigConnect', function (evt) {
      evt.detail.options.method = 'POST'
      evt.detail.options.headers = {
        'Authorization': 'Bearer ' + localStorage.getItem('token'),
        'Content-Type': 'application/json'
      }
      // Move the hx-vals out of the URL and into the POST body
      evt.detail.options.payload = JSON.stringify(evt.detail.parameters)
      evt.detail.url = evt.detail.url.split('?')[0]
    })
    ```

4. **Use the SSE extension as normal.** Nothing in your markup has to change:

    ```html
    <div hx-ext="sse"
         sse-connect="/api/stream"
         hx-vals='{"query": "kittens"}'
         sse-swap="result">
      Waiting…
    </div>
    ```

   The extension will:

   - collect `{"query": "kittens"}` from `hx-vals`,
   - fire `htmx:sseConfigConnect` so your listener can rewrite the URL/options as shown above,
   - and finally call `htmx.createEventSource(url, options)`, which constructs an `SSE` (from `sse.js`) that performs a `POST /api/stream` with your Authorization header and a JSON body of `{"query":"kittens"}`.

### Reusing the same handler for many endpoints

Because `htmx:sseConfigConnect` bubbles, a single listener on `document.body` can configure every SSE connection on the page. Use `evt.detail.elt` (or its attributes) to decide whether to act on a specific connection.

## Events fired by this extension

In addition to those documented at <https://htmx.org/extensions/sse>:

| Event | Description |
| --- | --- |
| `htmx:sseConfigConnect` | Fired before each EventSource is constructed. Cancelable. `detail` contains `url`, `options`, `parameters`, `headers`, `elt`. |
