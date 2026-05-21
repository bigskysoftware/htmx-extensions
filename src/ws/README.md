# htmx-ext-ws — WebSockets extension

The canonical documentation lives at <https://htmx.org/extensions/ws> (source: <https://github.com/bigskysoftware/htmx/blob/master/www/content/extensions/ws.md>).

This page documents extension features that go beyond the canonical reference, in particular how to configure the WebSocket connection (set query parameters from `hx-vals`, override the URL, etc.).

## Configuring the connection

### Sending `hx-vals` as query parameters

Any values declared on the connecting element through [`hx-vals`](https://htmx.org/attributes/hx-vals/) (or `hx-vars`) are automatically URL-encoded and appended to the `ws-connect` URL as query parameters before the WebSocket is opened. Existing query strings on the URL are preserved.

```html
<div hx-ext="ws"
     ws-connect="/chat"
     hx-vals='{"room": "lobby", "token": "abc123"}'>
  ...
</div>
```

Opens a WebSocket against `/chat?room=lobby&token=abc123`. This is the recommended way to pass authentication tokens (such as a JWT) to a WebSocket endpoint, since the browser's `WebSocket` constructor does not support custom request headers.

### The `htmx:wsConfigConnect` event

Right before the extension calls `htmx.createWebSocket(url)` it fires a cancelable `htmx:wsConfigConnect` event on the element. The event's `detail` object lets you inspect and override the connection:

| `detail` property | Description |
| --- | --- |
| `url` | The fully-built URL (including any appended `hx-vals`). Mutate to change. |
| `parameters` | The plain object of `hx-vals` / `hx-vars` collected from the element. |
| `elt` | The element that initiated the connection. |

Calling `event.preventDefault()` aborts the connection entirely; this is useful when, for example, you want to wait for an auth token before opening the socket.

```javascript
document.body.addEventListener('htmx:wsConfigConnect', function (evt) {
  // Add a freshly-minted token at connect time
  evt.detail.url += (evt.detail.url.includes('?') ? '&' : '?') +
    'token=' + encodeURIComponent(getAuthToken())
})
```

This event is the connection-time counterpart of the existing `htmx:wsConfigSend` event, which fires before each message is sent.

## Customizing the `WebSocket` instance

The extension uses `htmx.createWebSocket(url)` to construct every WebSocket. Replace that function if you need to use a custom `WebSocket` subclass or set protocols:

```javascript
htmx.createWebSocket = function (url) {
  var ws = new WebSocket(url, ['my-subprotocol'])
  ws.binaryType = 'arraybuffer'
  return ws
}
```

## Events fired by this extension

In addition to those documented at <https://htmx.org/extensions/ws>:

| Event | Description |
| --- | --- |
| `htmx:wsConfigConnect` | Fired before each WebSocket is constructed. Cancelable. `detail` contains `url`, `parameters`, `elt`. |
