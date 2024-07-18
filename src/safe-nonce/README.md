The `safe-nonce` htmx extension can be used to improve the security of the application/web-site and help avoid XSS issues by allowing you to return known trusted inline scripts with full [nonce](https://developer.mozilla.org/docs/Web/HTML/Global_attributes/nonce) support while blocking all other inline scripts via an appropriate [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP). It improves the base security provided with the htmx.config.inlineScriptNonce feature by forcing you to provide a unique HX-Nonce response header along with the same random nonce on all trusted inline scripts to reduce the risk of untrusted script tags being allowed to run. By default htmx is designed to trust all inline scripts provided by your server when using inlineScriptNonce feature and this extension changes it to not trust them by default.

This feature is not a replacement for a good secure backend server implementation where all potential user input strings are sanitized by auto-escaping or a templating engine. This is just another layer of protection you can choose to add on top if needed. 

## Implementation Steps

1. Install the safe-nonce.js script in your page head or elsewhere
2. Set the hx-ext attribute in the body tag of all full page requests to `safe-nonce`
3. Generate a truly random nonce value on each server response
4. Return the random nonce in your default-src/script-src CSP response header or in a CSP meta tag
5. Return a htmx-config meta tag to set `safeInlineScriptNonce` to your nonce at the top of your page head (Note that htmx only reads the first htmx-config meta tag in the page so move it as high as you can)
6. Update all inline script tags you trust to include `nonce="{random-nonce}"` attribute
7. Return the `HX-Nonce` response header set to the value of your random nonce on all responses that have protected inline scripts
8. Use developer tools to test your website loads without CSP warnings in console output

If you only need to support inline scripts in head and not in the body that gets replaced by htmx then you do not need this extension and can implement just steps 3-6 above but instead set `allowScriptTags` config to false at step 5 and this will protect your page. If you can move all your scripts into external js files, then you do not need to support inline scripts and can set `allowScriptTags` false and set a strong CSP instead. Also consider disabling `allowEval` config value as well to improve your websites security.

When partial AJAX requests are swapped into part of the page the `HX-Nonce` header will be used to update the nonce attribute of only the trusted inline scripts to match the initial page load nonce value which allows just these scripts to execute. There is nonce reuse protection so the initial page load nonce if it is discovered cannot be abused.

Note It would be ideal to use the existing Content-Security-Policy header instead of a custom HX-Nonce header for this purpose but browsers only process CSP headers on full page loads and not the partial AJAX requests htmx uses.

## Configuration Reference

<div class="info-table">

| Config Variable                       | Info                                                                                                                                                                                                                     |
|---------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `htmx.config.safeInlineScriptNonce`   | added by `safe-nonce` and should be set to the random nonce generated on each full page load when using this extension                                                                                                   |
| `htmx.config.inlineScriptNonce`       | disabled by `safe-nonce`, so it does not trust and replace script nonces for all replaced content                                                                                                                        |
| `htmx.config.inlineSlyeNonce`         | defaults to `''`, meaning that no nonce will be added to inline styles. Setting this to your random nonce will allow indicator styles to work with a strong style-src CSP header                                         |
| `htmx.config.includeIndicatorStyles`  | defaults to `true` (determines if the indicator styles are loaded) and this can be disabled instead of using `inlineStyleNonce` option                                                                                   |
| `htmx.config.refreshOnHistoryMiss`    | normally defaults to `false`, but set `true` by safe-nonce so that htmx will issue a full page refresh on history misses rather than use an AJAX request which will not update script nonces correctly                   |
| `htmx.config.allowScriptTags`         | defaults to `true`, determines if htmx will process script tags found in new content and should be disabled if you don't need this feature. If you disable this you probably do not need the `safe-nonce` extension      |
| `htmx.config.allowEval`               | defaults to `true`, can be used to disable htmx's use of eval for certain features (e.g. trigger filters). Should be disabled if you don't use these features so you can remove unsafe-eval from CSP and protect you page|
| `htmx.config.selfRequestsOnly`        | defaults to `true`, whether to only allow AJAX requests to the same domain as the current document. Avoid setting this false as it has the risk of bypassing some of the protections                                     |

</div>

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