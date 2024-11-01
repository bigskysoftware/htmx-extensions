// This adds the "preload" extension to htmx.  By default, this will
// preload the targets of any tags with `href` or `hx-get` attributes
// if they also have a `preload` attribute as well.  See documentation
// for more details
htmx.defineExtension('preload', {

  onEvent: function(name, event) {
    // Only take actions on "htmx:afterProcessNode"
    if (name !== 'htmx:afterProcessNode') {
      return
    }

    // SOME HELPER FUNCTIONS WE'LL NEED ALONG THE WAY

    // attr gets the closest non-empty value from the attribute.
    var attr = function(node, property) {
      if (node == undefined) { return undefined }
      return node.getAttribute(property) || node.getAttribute('data-' + property) || attr(node.parentElement, property)
    }

    const isPreloadableFromElement = function (node) {
      if (node.tagName === 'INPUT') {
        const preloadableInputTypes = ['checkbox', 'radio', 'submit'];
        return preloadableInputTypes.some(type => node.getAttribute('type') === type);
      }
      if (node.tagName === 'LABEL') {
        return node.control && isPreloadableFromElement(node.control);
      }
      return node.tagName === 'SELECT' || node.tagName === 'BUTTON' || node.type === 'submit';
    }

    // load handles the actual HTTP fetch, and uses htmx.ajax in cases where we're
    // preloading an htmx resource (this sends the same HTTP headers as a regular htmx request)
    var load = function(node) {
      // Called after a successful AJAX request, to mark the
      // content as loaded (and prevent additional AJAX calls.)
      var done = function(html) {
        if (!node.preloadAlways) {
          node.preloadState = 'DONE'
        }

        if (attr(node, 'preload-images') == 'true') {
          document.createElement('div').innerHTML = html // create and populate a node to load linked resources, too.
        }
      }

      // Perform an AJAX request
      var ajaxGetRequest = function (url, source = node, values = undefined) {
        htmx.ajax('GET', url, {
          source: source,
          values: values,
          handler: function(elt, info) {
            done(info.xhr.responseText);
          }
        });
      }

      // Enforce original formData element order after modifying it's contents
      // since cache is sensitive to GET query parameter order
      var reinforceFormDataOrder = function (formData) {
        const formElements = node.form.elements;
        const orderedFormData = new FormData();
        for(let i = 0; i < formElements.length; i++) {
          const element = formElements.item(i);
          if (formData.has(element.name) && element.tagName === 'SELECT') {
            orderedFormData.append(element.name, formData.get(element.name));
            continue;
          }
          if (formData.has(element.name) && formData.getAll(element.name).includes(element.value)) {
            orderedFormData.append(element.name, element.value);
          }
        }
        return orderedFormData;
      }

      return function() {
        // If this value has already been loaded, then do not try again.
        if (node.preloadState !== 'READY') {
          return
        }

        // Special handling for HX-GET - use built-in htmx.ajax function
        // so that headers match other htmx requests, then set
        // node.preloadState = TRUE so that requests are not duplicated
        // in the future
        var hxGet = node.getAttribute('hx-get') || node.getAttribute('data-hx-get')
        if (hxGet) {
          ajaxGetRequest(hxGet);
          return
        }

        // Handle preloadable form elements - preload form with alternated values
        if (isPreloadableFromElement(node)) {
          var hxGet = node.form.getAttribute('hx-get') || node.form.getAttribute('data-hx-get');
          if (node.tagName === 'BUTTON' || node.type === 'submit') {
            ajaxGetRequest(hxGet, source=node.form);
            return
          }
          
          const inputName = node.name || node.control.name;
          const formData = htmx.values(node.form);
          if (node.tagName === 'SELECT') {
            Array.from(node.options).forEach(option => {
              if (option.selected) return;
              formData.set(inputName, option.value);
              const formDataOrdered = reinforceFormDataOrder(formData);
              ajaxGetRequest(hxGet, source=node.form, values=formDataOrdered);
            });
            return
          }

          const inputType = node.getAttribute("Type") || node.control.getAttribute("Type");
          const nodeValue = node.value || node.control.value;
          if (inputType === 'radio') {
            formData.set(inputName, nodeValue);
          } else if (inputType === 'checkbox'){
            const inputValues = formData.getAll(inputName);
            if (inputValues.includes(nodeValue)) {
              formData[inputName] = inputValues.filter(value => value !== nodeValue);
            } else {
              formData.append(inputName, nodeValue);
            }

          }
          const formDataOrdered = reinforceFormDataOrder(formData);
          ajaxGetRequest(hxGet, source=node.form, values=formDataOrdered);
          return
        }

        // Otherwise, perform a standard xhr request, then set
        // node.preloadState = TRUE so that requests are not duplicated
        // in the future.
        if (node.getAttribute('href')) {
          var r = new XMLHttpRequest()
          r.open('GET', node.getAttribute('href'))
          r.onload = function() { done(r.responseText) }
          r.send()
        }
      }
    }

    // This function processes a specific node and sets up event handlers.
    // We'll search for nodes and use it below.
    var init = function(node) {
      // Add listeners only to nodes which include "GET" transactions
      // or preloadable "GET" form elements
      const attributes = ['href', 'hx-get', 'data-hx-get'];
      const nodeIncludesGetTransaction = attributes.some(a => node.hasAttribute(a));
      const formIncludesGetTransaction = node.form && attributes.some(a => node.form.hasAttribute(a));
      if (!(nodeIncludesGetTransaction || (formIncludesGetTransaction && isPreloadableFromElement(node)))) {
        return
      }

      // Don't preload <input> elements contained in <label> to prevent sending request twice
      if (node.tagName === 'INPUT' && node.closest('label')) {
        return;
      }

      // Initialize form input elements and bottons
      if (node.tagName === 'FORM') {
        for (let i = 0; i < node.elements.length; i++) {
          const element = node.elements.item(i);
          init(element);
          element.labels.forEach(init);
        }
        return
      }

      // Guarantee that we only initialize each node once.
      if (node.preloadState !== undefined) {
        return
      }

      // Get event name from config.
      var on = attr(node, 'preload') || 'mousedown'
      const always = on.indexOf('always') !== -1
      if (always) {
        on = on.replace('always', '').trim()
      }

      // FALL THROUGH to here means we need to add an EventListener

      // Apply the listener to the node
      node.addEventListener(on, function(evt) {
        if (node.preloadState === 'PAUSE') { // Only add one event listener
          node.preloadState = 'READY' // Required for the `load` function to trigger

          // Special handling for "mouseover" events.  Wait 100ms before triggering load.
          if (on === 'mouseover') {
            window.setTimeout(load(node), 100)
          } else {
            load(node)() // all other events trigger immediately.
          }
        }
      })

      // Special handling for certain built-in event handlers
      switch (on) {
        case 'mouseover':
          // Mirror `touchstart` events (fires immediately)
          node.addEventListener('touchstart', load(node))

          // WHhen the mouse leaves, immediately disable the preload
          node.addEventListener('mouseout', function(evt) {
            if ((evt.target === node) && (node.preloadState === 'READY')) {
              node.preloadState = 'PAUSE'
            }
          })
          break

        case 'mousedown':
          // Mirror `touchstart` events (fires immediately)
          node.addEventListener('touchstart', load(node))
          break
      }

      // Mark the node as ready to run.
      node.preloadState = 'PAUSE'
      node.preloadAlways = always
      htmx.trigger(node, 'preload:init') // This event can be used to load content immediately.
    }

    // Search for all child nodes that have a "preload" attribute
    const parent = event.target || event.detail.elt;
    parent.querySelectorAll("[preload]").forEach(function(node) {
      // Initialize the node with the "preload" attribute
      init(node)

      // Initialize all child elements that are anchors or have `hx-get` (use with care)
      node.querySelectorAll('a,[hx-get],[data-hx-get]').forEach(init)
    })
  }
})
