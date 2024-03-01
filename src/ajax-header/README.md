This extension adds the `X-Requested-With` header to requests with the value "XMLHttpRequest".

This header is commonly used by javascript frameworks to differentiate ajax requests from normal http requests.

## Install

```html
<script src="https://unpkg.com/htmx-ext-ajax-header/ajax-header.js@2.0.0"></script>
```

## Usage

```html
<body hx-ext="ajax-header">
 ...
</body>
```
