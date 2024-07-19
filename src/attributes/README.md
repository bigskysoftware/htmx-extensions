# HTMX Attributes Extension

This extension introduces a new `hx-swap` and `hx-swap-oob` value called "attributes" that allows for swapping only the attributes of the target element, leaving its children untouched.

## Installation

Include the `attributes.js` file in your project after the `htmx.js` script:

```html
<script src="path/to/htmx.js"></script>
<script src="path/to/attributes.js"></script>
```

## Usage

To use the extension, add the `hx-ext="attributes"` attribute to your HTML element or any parent element:

```html
<div hx-ext="attributes">
	<!-- Your content here -->
</div>
```

Then, use the `attributes` value for `hx-swap` or `hx-swap-oob`:

```html
<div hx-get="/update-attributes" hx-swap="attributes">
	<!-- Only the attributes of this div will be updated -->
</div>
```

For out-of-band swaps:

```html
<div id="target" hx-get="/update-attributes">
	<!-- This div's attributes will be updated -->
</div>

<!-- The hx-post attribute will replace the hx-get attribute in the source element -->
<div id="target" hx-swap-oob="attributes" hx-post="/new-action"></div>
```

## Examples

### Form behaviour

Here we change the url that the form's `hx-post` points to, to change the behaviour of our form, without needing to return any of the content of the form, which should remain unchanged.

```html
<form hx-post="/original-action">
	<div>Bunch of stuff</div>
	<input name="foo" type="text" />
	<button type="submit">Submit</button>
	<a hx-post="/change-form" hx-swap="attributes" hx-target="form"
		>Change form action</a
	>
</form>
```

server responds with:

```html
<form hx-post="/new-action"></form>
```

### Aria Roles

On submission of a form we validate on the backend but just want to update aria-role and classes on the form, plus an error message:

```html
<form id="form" hx-post="/action">
	<div>Bunch of stuff</div>
	<label for="foo">Foo:</label>
	<input id="foo" name="foo" type="text" />
	<div id="error"></div>
	<button type="submit">Submit</button>
</form>
```

server responds with:

```html
<form
	id="form"
	hx-swap-oob="attributes"
	aria-invalid="true"
	class="border-2 border-red-800"
></form>
<div id="error" hx-swap-oob="true">Bad foo!</div>
```

## Features

- Swaps only the attributes of the target element
- Preserves the `id` and `hx-ext` attributes of the target
- Supports out-of-band (OOB) swaps
- Compatible with \_hyperscript (if available)

## Behavior

1. All attributes of the target element are removed, except for `id` and `hx-ext`.
2. All attributes from the source element (response) are copied to the target element.
3. The `hx-swap-oob` attribute is not copied to the target element.
4. If \_hyperscript is available, it will process the target element after the attribute swap.

## Contributing

Contributions are welcome! Please submit a pull request or create an issue to discuss proposed changes or report bugs.

## License

This extension is released under the same license as HTMX. Please see the HTMX license for more information.
