
The `include-vals` extension allows you to programmatically include values in a request with
a `include-vals` attribute.  The value of this attribute is one or more name/value pairs, which
will be evaluated as the fields in a javascript object literal.

## Install

```html
<script src="https://unpkg.com/htmx-ext-include-vals/include-vals.js@2.0.0"></script>
```

## Usage

```html
<div hx-ext="include-vals">
    <div hx-get="/test" include-vals="included:true, computed: computeValue()">
      Will Include Additional Values
    </div>
</div>
```
