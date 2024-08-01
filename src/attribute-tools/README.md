# `attribute-tools` - Set or Remove Attributes

## Manipulate attributes of an element (e.g. for attributes like "open", "aria-busy", "progress[value]")

The `attribute-tools` extension  allows you to specify attributes that will be set or removed from elements by using
an `attribute` or `data-attribute` attribute.  

An `attributes` attribute value consists of "runs", which are separated by an `&` character.  All
attributes operations within a given run will be applied sequentially, with the delay specified.

Within a run, a `,` character separates distinct attribute operations.

An attribute operation is an operation name `set` or `remove`, followed by an attribute name,
optionally followed by an equal `=` and a value, optionally followed by a colon `:` and a time delay (e.g. 1s).

## Out-of-band attribute manipulation

There is also the option to use `apply-parent-attributes`, or `data-apply-parent-attributes`, which take the same format as `attributes`
but is instead designed for out-of-band updates, allowing you to manipulate attributes of an existing element in the DOM
without otherwise knowing or altering its state.

Any element with this property will schedule attributes to be applied to its _parent_ element, _removing_ itself afterwards,
so it should ideally be used as part of an `hx-swap-oob="beforeend: #some-element"` to add them to the end of the target element.

## Install

```html
<script src="https://unpkg.com/htmx-ext-attribute-tools@2.0.1/attribute-tools.js"></script>
```

## Usage

```html
<!-- The following DOM has attributes swapped in and out as scheduled -->
<div hx-ext="attribute-tools">
    <div attributes="add foo=bar"/> <!-- adds the attribute "foo" with the value "bar" after 0ms -->
    <div bar="baz" attributes="remove bar:1s"/> <!-- removes the atttribute "bar" after 1s -->
    <div bar="baz" foo="blah" attributes="remove bar:1s, set foo=hello:1s, set open:1s"/> <!-- removes the attribute "bar" after 1s
                                                                then sets the attribute "foo" to "hello" 1s after that then sets the attribute "open" 1s after that -->
    <div bar="baz" attributes="remove bar:1s & set foo:1s"/> <!-- removes the attribute "bar" and adds
                                                                 attribute "foo" after 1s  -->
</div>

<!-- The following OOB update surgically applies attributes to "my-element" -->
<div hx-swap-oob="beforeend: #my-element">
    <div hx-ext="attribute-tools"
         apply-parent-attribute="add foo, remove foo:10s"/> <!-- adds the attribute "foo" to "my-element" for 10s -->
</div>
```
