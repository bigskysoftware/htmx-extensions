This extension supports transforming a JSON/XML request response into HTML via a client-side template before it is
swapped into the DOM.  Currently four client-side templating engines are supported:

* [mustache](https://github.com/janl/mustache.js)
* [handlebars](https://handlebarsjs.com/)
* [nunjucks](https://mozilla.github.io/nunjucks/)
* [xslt](https://developer.mozilla.org/en-US/docs/Web/XSLT)

When you add this extension on an element, any element below it in the DOM can use one of four attributes named
`<template-engine>-template` (e.g. `mustache-template`) with a template ID, and the extension will resolve and render
the template the standard way for that template engine:

* `mustache` - looks a mustache &lt;script> tag up by ID for the template content
* `handlebars` - looks a handlebars &lt;script> tag up by ID for the template content
* `nunjucks` - resolves the template by name via `nunjucks.render(<template-name>)
* `xslt` - looks an XSLT &lt;script> tag up by ID for the template content

The AJAX response body will be parsed as JSON/XML and passed into the template rendering.

A second "array" version of each template is now offered, which is particularly helpful for APIs that return arrays of data. These templates are referenced as `<template-engine>-array-template`, and the data is accessed as `data.my_server_field`. At least in the case of `mustache`, it also enables use of loops using the `{{#data}} my_server_field {{/data}}` syntax.

## Install

```html
<script src="https://unpkg.com/htmx-ext-client-side-templates@2.0.0/client-side-templates.js"></script>
```

## Usage

```html
<div hx-ext="client-side-templates">
  <button hx-get="/some_json"
          mustache-template="my-mustache-template">
     Handle with mustache
  </button>
  <button hx-get="/some_json"
          handlebars-template="my-handlebars-template">
     Handle with handlebars
  </button>
  <button hx-get="/some_json"
          nunjucks-template="my-nunjucks-template">
     Handle with nunjucks
  </button>
  <button hx-get="/some_xml" 
          xslt-template="my-xslt-template">
     Handle with XSLT
  </button>
</div>
```

### Full Mustache HTML Example

To use the client side template, you will need to include htmx, the extension, and the rendering engine.
Here is an example of this setup for Mustache using
a [`<template>` tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template).

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <meta name="htmx-config" content='{"selfRequestsOnly":false}'>
  <title>JS Bin</title>
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  <script src="https://unpkg.com/htmx-ext-client-side-templates@2.0.0/client-side-templates.js"></script>
  <script src="https://unpkg.com/mustache@latest"></script>
</head>
<body>
  <div hx-ext="client-side-templates">
    <button hx-get="https://jsonplaceholder.typicode.com/todos/1"
            hx-swap="innerHTML"
            hx-target="#content"
            mustache-template="foo">
      Click Me
    </button>

    <p id="content">Start</p>

    <template id="foo">
      <p> {{userId}} and {{id}} and {{title}} and {{completed}}</p>
    </template>
  </div>
</body>
</html>
```
[demo (external link)](https://barakplasma.github.io/htmx-weather/mustache)

Here's a working example using the `mustache-array-template` working against an API that returns an array:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <meta name="htmx-config" content='{"selfRequestsOnly":false}'>
  <title>JS Bin</title>
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  <script src="https://unpkg.com/htmx-ext-client-side-templates@2.0.0/client-side-templates.js"></script>
  <script src="https://unpkg.com/mustache@latest"></script>
</head>
<body>
  <div hx-ext="client-side-templates">
    <button hx-get="https://jsonplaceholder.typicode.com/users"
            hx-swap="innerHTML"
            hx-target="#content"
            mustache-array-template="foo">
      Click Me
    </button>

    <p id="content">Start</p>

    <template id="foo">
      {{#data}}
      <p> {{name}} at {{email}} is with {{company.name}}</p>
      {{/data}}
    </template>
  </div>
</body>
</html>
```
[demo (external link)](https://barakplasma.github.io/htmx-weather/mustache-array)

### Full XSLT HTML Example

To use the client side template, you will need to include htmx and the extension.
Here is an example of this setup for XSLT using a [`<script>` tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script).

If you wish to put a template into another file, you can use a directive such as
 `<object id="template-id" data="my-template.xml" style="position: absolute; bottom: 0px; width: 0px; height: 0px;">`.
Some styling is needed to keep the object visible while not taking any space.

```html
<!doctype html>
<html>

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <meta name="htmx-config" content='{"selfRequestsOnly":false}'> 
  <title>Weather with htmx</title>
  <link rel="stylesheet" href="https://unpkg.com/mvp.css@1.15.0/mvp.css" />
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  <script src="https://unpkg.com/htmx-ext-client-side-templates@2.0.0/client-side-templates.js"></script>
</head>

<body>
  <script id="foo" type="application/xml">
      <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
        <xsl:template match="HourlyLocationsForecast">
          <xsl:for-each select="Location">
            <aside>
              <h3>
                <xsl:value-of select="LocationMetaData/LocationName" />
              </h3>
              <table>
                <tr>
                  <th>time</th>
                  <th>temp</th>
                  <th>humidity</th>
                </tr>
                <xsl:for-each select="LocationData/Forecast">
                  <tr>
                    <td>
                      <xsl:value-of select="substring(ForecastTime, 9)" />
                    </td>
                    <td>
                      <xsl:value-of select="Temperature" /> °C
                    </td>
                    <td>
                      <xsl:value-of select="RelativeHumidity" />%
                    </td>
                  </tr>
                </xsl:for-each>
              </table>
            </aside>
          </xsl:for-each>
        </xsl:template>
      </xsl:stylesheet>
    </script>
  <section hx-ext="client-side-templates" hx-trigger="load"
    hx-get="https://proxy.cors.sh/https://ims.gov.il/sites/default/files/ims_data/xml_files/IMS_001.xml"
    hx-swap="innerHTML" xslt-template="foo">waiting for data
  </section>
</body>

</html>
```
[demo (external link)](https://barakplasma.github.io/htmx-weather/)


### Nunjucks Integration

The **Nunjucks** template engine offers a highly versatile option for transforming JSON/XML responses into HTML. Nunjucks provides additional functionality: if the specified template is not found in the document (e.g., via a `<script>` tag), it will send an AJAX request to fetch the template from the server dynamically. How Nunjucks Resolves Templates:

1. **Client-Side Template Resolution**: If a [`<script>` tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script) or [`<template>` tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) with the specified template ID (e.g., `dynamic-template`) exists, Nunjucks will render the data using this template.
2. **Server-Side Template Resolution**: If the template is not found in the DOM, Nunjucks will automatically make an HTTP request to fetch the template file from the server using the name as the file path. For example, specifying `nunjucks-template="user-template.html"` will prompt Nunjucks to request `/user-template.html` from the server. This capability is particularly useful for creating dynamic, server-generated templates that aren't hardcoded into the page.


```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Nunjucks Example</title>
  <!-- Include HTMX, the extension, and Nunjucks -->
  <meta name="htmx-config" content='{"selfRequestsOnly":false}'>
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  <script src="https://unpkg.com/htmx-ext-client-side-templates@2.0.0/client-side-templates.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/nunjucks/3.2.4/nunjucks.min.js"></script>
</head>
<body>
  <div hx-ext="client-side-templates">
    <h1>Nunjucks Template Example</h1>

    <!-- Button to render using a client-side template -->
    <button hx-get="https://jsonplaceholder.typicode.com/todos/1"
            hx-swap="innerHTML"
            hx-target="#content"
            nunjucks-template="dynamic-template">
      Render with Client-Side Template
    </button>

    <!-- Placeholder for rendering -->
    <div id="content">Waiting for data...</div>

    <!-- Client-side template defined here -->
    <script type="text/template" id="dynamic-template">
      <ul>
        <li><strong>User ID:</strong> {{ userId }}</li>
        <li><strong>Title:</strong> {{ title }}</li>
        <li><strong>Completed:</strong> {{ completed }}</li>
      </ul>
    </script>

    <!-- Button to render using a server-side template -->
    <button hx-get="https://jsonplaceholder.typicode.com/todos/2"
            hx-swap="innerHTML"
            hx-target="#content"
            nunjucks-template="user-template.html">
      Render with Server-Side Template 
    </button>
  </div>
</body>
</html>
```

## CORS and REST/JSON

As a warning, many web services use CORS protection and/or other protection schemes to reject a
REST/JSON request from a web browser - for example, GitHub will issue a CORS error if you try to
use the above snippet to access public APIs. This can be frustrating, as a dedicated REST development
client may work fine, but the CORS error will appear when running JavaScript. This doesn't really
have anything to do with HTMX (as you'd have the same issues with any JavaScript code), but can be
a frustrating surprise.

Unfortunately, the solution will vary depending on the provider of the web service. Depending on
what you are trying to do, you may find it easier to rely on your server-side framework to manage/proxy
these requests to 3rd parties services.

## selfRequestsOnly
[Since v2 of htmx](https://htmx.org/migration-guide-htmx-1/#:~:text=If%20you%20want%20to%20make%20cross%2Ddomain%20requests%20with%20htmx%2C%20revert%20htmx.config.selfRequestsOnly%20to%20false), requests to external domains are blocked by default. You can add the [selfRequestsOnly](https://htmx.org/reference/#:~:text=htmx.config.selfRequestsOnly) config (`<meta name="htmx-config" content='{"selfRequestsOnly":false}'>`) to allow requests to external domains to work.
