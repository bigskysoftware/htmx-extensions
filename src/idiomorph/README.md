This extension allows you to use [Idiomorph](https://github.com/bigskysoftware/idiomorph) as the swapping mechanism in htmx.

## Install

```html
<script src="https://unpkg.com/htmx-ext-idiomorph@2.0.0/idiomorph.js"></script>
```

## Usage

```html
<header>
  <script src="https://unpkg.com/htmx.org@latest"></script>
  <script src="https://unpkg.com/idiomorph@0.7.1"></script>
  <script src="https://unpkg.com/htmx-ext-idiomorph@2.0.0/idiomorph.js"></script>
</header>

<body>
  <div hx-ext="morph">
    <button hx-get="/example" hx-swap="morph:innerHTML">
      Morph My Inner HTML
    </button>

    <button hx-get="/example" hx-swap="morph:outerHTML">
      Morph My Outer HTML
    </button>
    
    <button hx-get="/example" hx-swap="morph">
      Morph My Outer HTML
    </button>
  </div>
</body>
```

## Configuring

The Idiomorph extension for htmx supports three different syntaxes for specifying behavior:

* `hx-swap='morph'` - This will perform a morph on the outerHTML of the target
* `hx-swap='morph:outerHTML'` - This will perform a morph on the outerHTML of the target (explicit)
* `hx-swap='morph:innerHTML'` - This will perform a morph on the innerHTML of the target (i.e. the children)
* `hx-swap='morph:<expr>'` - In this form, `<expr>` can be any valid JavaScript expression.  The results of the expression
   will be passed into the `Idiomorph.morph()` method as the configuration.

The last form gives you access to all the configuration options of Idiomorph.  So, for example, if you wanted to ignore
the input value in a given morph, you could use the following swap specification:

```html
  <button hx-get="/example" 
          hx-swap="morph:{ignoreActiveValue:true}"
          hx-target="closest form">
      Morph The Closest Form But Ignore The Active Input Value
  </button>
```

