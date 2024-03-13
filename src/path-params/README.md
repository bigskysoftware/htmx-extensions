
This extension uses request parameters to populate path variables. Used parameters are removed so they won't be sent in the query string or body anymore.

## Install

```html
<script src="https://unpkg.com/htmx-ext-path-params@2.0.0/path-params.js">
```

## Usage

This would invoke URL `/items/42?foo=bar`

```html
<div hx-ext="path-params">
    <a hx-get="/items/{itemId}" hx-vals='{"itemId": "42", "foo": "bar"}'>test</div>
</div>
```
