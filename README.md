# htmx Extensions

[htmx](https://htmx.org) provides an extension mechanism for defining and using extensions within htmx-based applications.
A list of extensions can be found at <https://extensions.htmx.org>.  If you wish to contribute an extension to that
list, open a PR request against <https://github.com/bigskysoftware/htmx-extensions/blob/dev/www/index.html>.

## Using Extensions

Using an extension involves two steps:

* include the extension definition, which will add it to the `htmx` extension registry
* reference the extension via the [hx-ext](https://htmx.org/attributes/hx-ext/) attribute

Here is an example

```html
  <script src="/path/to/ext/debug.js" defer></script>
  <button hx-post="/example" hx-ext="debug">This Button Uses The Debug Extension</button>
```

This loads the debug extension and then adds the debug extension to the given button.  (This
will print out extensive logging for the button, for debugging purposes.)

Note that the `hx-ext` tag may be placed on parent elements if you want a plugin to apply to an entire part of the DOM,
and on the `body` tag for it to apply to all htmx requests.

**Tip:** To use multiple extensions on one element, separate them with a comma:

```html
  <button hx-post="/example" hx-ext="debug, json-enc">This Button Uses Two Extensions</button>
```

## Ignoring Extensions

By default, extensions are applied to the DOM node where it is invoked, along with all child elements inside of that parent node.
If you need to disable an extension somewhere within the DOM tree, you can use the `ignore:` keyword to stop it from being used.

```html
<div hx-ext="debug">
  <button hx-post="/example">This button used the debug extension</button>
  <button hx-post="/example" hx-ext="ignore:debug">This button does not</button>
</div>
```

## Defining an Extension

To define an extension you call the `htmx.defineExtension()` function:

```html
<script>
    (function(){
        htmx.defineExtension('my-ext', {
            onEvent : function(name, evt) {
                console.log("Fired event: " + name, evt);
            }
        })
    })()
</script>
```

Typically, this is done in a stand-alone javascript file, rather than in an inline `script` tag.

Extensions should have names that are dash separated and that are reasonably short and descriptive.

Extensions can override the following default extension points to add or change functionality:

```javascript
{
    onEvent : function(name, evt) {return true;},
    transformResponse : function(text, xhr, elt) {return text;},
    isInlineSwap : function(swapStyle) {return false;},
    handleSwap : function(swapStyle, target, fragment, settleInfo) {return false;},
    encodeParameters : function(xhr, parameters, elt) {return null;}
}
```
