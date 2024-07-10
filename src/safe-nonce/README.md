The `safe-nonce` extension can be used to improve the security of the application/web-site and help avoid XSS issues by allowing you to return known trusted inline scripts with full [nonce](https://developer.mozilla.org/docs/Web/HTML/Global_attributes/nonce) support while blocking all other inline scripts via an appropriate [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP). It improves the base security provided with the htmx.config.inlineScriptNonce feature by forcing you to provide a unique HX-Nonce response header along with the same random nonce on all trusted inline scripts to reduce the risk of untrusted script tags being allowed to run. By default htmx is designed to trust all inline scripts provided by your server when using inlineScriptNonce feature and changes it to not trust them by default.

This feature is not a replacement for a good secure backend server implementation where all potential user input strings are sanitized by auto-escaping or a templating engine. This is just another layer of protection you can choose to add on top if needed. 

To implement this extension complete the following steps:

1. Install the safe-nonce.js script in your page head or elsewhere
2. Set the hx-ext attribute in the body tag of all full page requests to `safe-nonce`
3. Generate a truly random nonce value on each server response
4. Return the random nonce in your CSP response header or in a CSP meta tag
5. Return a htmx-config meta tag to set safeInlineScriptNonce to your nonce at the top of your page head (Note that htmx only reads the first htmx-config meta tag in the page so move it as high as you can)
6. Update all inline script tags you trust to include `nonce="{random-nonce}"` attribute
7. Return the `HX-Nonce` response header set to the value of your random nonce on all responses that have protected inline scripts
8. Use developer tools to test your website loads without CSP warnings in console output

When partial AJAX requests are swapped into part of the page the `HX-Nonce` header will be used to update the nonce attribute of only the trusted inline scripts to match the initial page load nonce value which allows just these scripts to execute. There is nonce reuse protection so the inital page load nonce if it is discovered can not be abused.

Note It would be ideal to use the existing Content-Security-Policy header instead of a custom HX-Nonce header for this purpose but browsers only process CSP headers on full page loads and not the partial AJAX requests htmx uses.

This extension is not compatible with part of the htmx history feature which fetches the page from the server via AJAX when the history is not cached because it updates the page without updating the script nonces correctly so the extension forces `refreshOnHistoryMiss` config to true handle this use case. 

Using this extension with the `selfRequestsOnly` default config disabled to allow external domains to be accessed via htmx requests is not recommended as it can undo some of the protections.

## Install

```html
<script src="https://unpkg.com/htmx-ext-safe-nonce@2.0.0/safe-nonce.js"></script>
```

## Usage

A sample initial page load response:

```html
HX-Nonce: "{random-nonce}"
Content-Security-Policy: "default-src 'self' 'nonce-{random-nonce}'; style-src 'self' 'nonce-{random-nonce}'"
<head>
    <meta name="htmx-config" content='{"safeInlineScriptNonce":"{random-nonce}","inlineStyleNonce":"{random-nonce}"}'>
    <script src="https://unpkg.com/htmx-ext-safe-nonce@2.0.0/safe-nonce.js"></script>
    <script nonce="{random-nonce}">console.log('safe')</script>
</head>
<body hx-ext="safe-nonce">
    ...
</body>
```

A sample htmx partial ajax page response:

```html
HX-Nonce: "{another-random-nonce}"
<script nonce="{another-random-nonce}">console.log('also safe')</script>
```