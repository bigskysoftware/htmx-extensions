
The `class-tools` extension  allows you to specify CSS classes that will be swapped onto or off of the elements by using
a `classes` or `data-classes` attribute.  This functionality allows you to apply
[CSS Transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions)
to your HTML without resorting to javascript.

A `classes` attribute value consists of "runs", which are separated by an `&` character.  All
class operations within a given run will be applied sequentially, with the delay specified.

Within a run, a `,` character separates distinct class operations.

A class operation is an operation name `add`, `remove`, or `toggle`, followed by a CSS class name,
optionally followed by a colon `:` and a time delay.

There is also the option to use `apply-parent-classes` or `data-apply-parent-classes` which uses the same format as `classes` but is instead designed for Out of band updates to allow you to manipulate CSS classes of an existing element in the DOM without otherwise knowing or altering its state. Any element with this property will apply classes to its parent and also remove this child element afterwards so should ideally be used as part of a `hx-swap-oob="beforeend: #some-element`.

## Install

```html
<script src="https://unpkg.com/htmx-ext-class-tools@2.0.1/class-tools.js"></script>
```

## Usage

```html
<div hx-ext="class-tools">
    <div classes="add foo"/> <!-- adds the class "foo" after 100ms -->
    <div class="bar" classes="remove bar:1s"/> <!-- removes the class "bar" after 1s -->
    <div class="bar" classes="remove bar:1s, add foo:1s"/> <!-- removes the class "bar" after 1s
                                                                then adds the class "foo" 1s after that -->
    <div class="bar" classes="remove bar:1s & add foo:1s"/> <!-- removes the class "bar" and adds
                                                                 class "foo" after 1s  -->
    <div classes="toggle foo:1s"/> <!-- toggles the class "foo" every 1s -->
</div>
<div hx-swap-oob="beforeend: #my-element"> <!-- adds the class "foo" to my-element for 10s -->
    <div hx-ext="class-tools" apply-parent-classes="add foo, remove foo:10s"></div>
</div>
```
