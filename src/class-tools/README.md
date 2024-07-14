# `class-tools` - Swap CSS classes

## Manipulate classes of an element (e.g. for CSS transitions)

The `class-tools` extension  allows you to specify CSS classes that will be swapped onto or off of the elements by using
a `classes` or `data-classes` attribute.  This functionality allows you to apply
[CSS Transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions)
to your HTML without resorting to javascript.

A `classes` attribute value consists of "runs", which are separated by an `&` character.  All
class operations within a given run will be applied sequentially, with the delay specified.

Within a run, a `,` character separates distinct class operations.

A class operation is an operation name `add`, `remove`, or `toggle`, followed by a CSS class name,
optionally followed by a colon `:` and a time delay.

## Out-of-band class manipulation

There is also the option to use `apply-parent-classes`, or `data-apply-parent-classes`, which take the same format as `classes`
but is instead designed for out-of-band updates, allowing you to manipulate CSS classes of an existing element in the DOM
without otherwise knowing or altering its state.

Any element with this property will schedule classes to be applied to its _parent_ element, _removing_ itself afterwards,
so it should ideally be used as part of an `hx-swap-oob="beforeend: #some-element"` to add them to the end of the target element.

## Install

```html
<script src="https://unpkg.com/htmx-ext-class-tools@2.0.1/class-tools.js"></script>
```

## Usage

```html
<!-- The following DOM has classes swapped in and out as scheduled -->
<div hx-ext="class-tools">
    <div classes="add foo"/> <!-- adds the class "foo" after 100ms -->
    <div class="bar" classes="remove bar:1s"/> <!-- removes the class "bar" after 1s -->
    <div class="bar" classes="remove bar:1s, add foo:1s"/> <!-- removes the class "bar" after 1s
                                                                then adds the class "foo" 1s after that -->
    <div class="bar" classes="remove bar:1s & add foo:1s"/> <!-- removes the class "bar" and adds
                                                                 class "foo" after 1s  -->
    <div classes="toggle foo:1s"/> <!-- toggles the class "foo" every 1s -->
</div>

<!-- The following OOB update surgically applies CSS classes to "my-element" -->
<div hx-swap-oob="beforeend: #my-element">
    <div hx-ext="class-tools"
         apply-parent-classes="add foo, remove foo:10s"/> <!-- adds the class "foo" to "my-element" for 10s -->
</div>
```
