/*
Server Sent Events Extension
============================
This extension adds support for Server Sent Events to htmx.  See /www/extensions/sse.md for usage instructions.

*/

(function() {
  /** @type {import("../htmx").HtmxInternalApi} */
  var api

  /**
   * sseSources keeps a reference to the EventSource that was created for an element,
   * together with the attribute values it was created from.
   *
   * htmx fires htmx:afterProcessNode again every time an element's attributes change,
   * and it wipes that element's internal data right before doing so. Without this map
   * the extension has no reference left to the connection it opened earlier, so it
   * would open a second one and leave the first one open forever.
   *
   * @type {WeakMap<HTMLElement, {source: EventSource, url: string, closeAttribute: string}>}
   */
  var sseSources = new WeakMap()

  /**
   * sseListeners keeps the listeners that were registered for an element, so that they
   * can be removed before the element is registered again.
   *
   * This is needed for the same reason as sseSources: htmx wipes an element's internal
   * data before it re-fires htmx:afterProcessNode, so sseEventListener no longer refers
   * to what was registered earlier, and the element would end up listening twice.
   *
   * @type {WeakMap<HTMLElement, Array<{source: EventSource, name: string, listener: Function}>>}
   */
  var sseListeners = new WeakMap()

  htmx.defineExtension('sse', {

    /**
     * Init saves the provided reference to the internal HTMX API.
     *
     * @param {import("../htmx").HtmxInternalApi} api
     * @returns void
     */
    init: function(apiRef) {
      // store a reference to the internal API.
      api = apiRef

      // set a function in the public API for creating new EventSource objects
      if (htmx.createEventSource == undefined) {
        htmx.createEventSource = createEventSource
      }
    },

    getSelectors: function() {
      return ['[sse-connect]', '[data-sse-connect]', '[sse-swap]', '[data-sse-swap]']
    },

    /**
     * onEvent handles all events passed to this extension.
     *
     * @param {string} name
     * @param {Event} evt
     * @returns void
     */
    onEvent: function(name, evt) {
      var parent = evt.target || evt.detail.elt
      switch (name) {
        case 'htmx:beforeCleanupElement':
          // Try to remove remove an EventSource when elements are removed
          closeEventSource(parent, 'nodeReplaced')

          return

        // Try to create EventSources when elements are processed
        case 'htmx:afterProcessNode':
          ensureEventSourceOnElement(parent)
      }
    }
  })

  /// ////////////////////////////////////////////
  // HELPER FUNCTIONS
  /// ////////////////////////////////////////////

  /**
   * createEventSource is the default method for creating new EventSource objects.
   * it is hoisted into htmx.config.createEventSource to be overridden by the user, if needed.
   *
   * @param {string} url
   * @returns EventSource
   */
  function createEventSource(url) {
    return new EventSource(url, { withCredentials: true })
  }

  /**
   * registerSSE looks for attributes that can contain sse events, right
   * now hx-trigger and sse-swap and adds listeners based on these attributes too
   * the closest event source
   *
   * @param {HTMLElement} elt
   */
  function registerSSE(elt) {
    // Drop what this element registered earlier, so that processing it again does not
    // leave it listening for the same event twice
    removeSSEListeners(elt)

    // Add message handlers for every `sse-swap` attribute
    if (api.getAttributeValue(elt, 'sse-swap')) {
      // Find closest existing event source
      var sourceElement = api.getClosestMatch(elt, hasEventSource)
      if (sourceElement == null) {
        // api.triggerErrorEvent(elt, "htmx:noSSESourceError")
        return null // no eventsource in parentage, orphaned element
      }

      // Set internalData and source
      var internalData = api.getInternalData(sourceElement)
      var source = internalData.sseEventSource

      var sseSwapAttr = api.getAttributeValue(elt, 'sse-swap')
      var sseEventNames = sseSwapAttr.split(',')

      for (var i = 0; i < sseEventNames.length; i++) {
        const sseEventName = sseEventNames[i].trim()
        const listener = function(event) {
          // If the source is missing then close SSE
          if (maybeCloseSSESource(sourceElement)) {
            return
          }

          // If the body no longer contains the element, remove the listener
          if (!api.bodyContains(elt)) {
            source.removeEventListener(sseEventName, listener)
            return
          }

          // swap the response into the DOM and trigger a notification
          if (!api.triggerEvent(elt, 'htmx:sseBeforeMessage', event)) {
            return
          }
          swap(elt, event.data)
          api.triggerEvent(elt, 'htmx:sseMessage', event)
        }

        // Register the new listener
        api.getInternalData(elt).sseEventListener = listener
        addSSEListener(elt, source, sseEventName, listener)
      }
    }

    // Add message handlers for every `hx-trigger="sse:*"` attribute
    if (api.getAttributeValue(elt, 'hx-trigger')) {
      // Find closest existing event source
      var sourceElement = api.getClosestMatch(elt, hasEventSource)
      if (sourceElement == null) {
        // api.triggerErrorEvent(elt, "htmx:noSSESourceError")
        return null // no eventsource in parentage, orphaned element
      }

      // Set internalData and source
      var internalData = api.getInternalData(sourceElement)
      var source = internalData.sseEventSource

      var triggerSpecs = api.getTriggerSpecs(elt)
      triggerSpecs.forEach(function(ts) {
        if (ts.trigger.slice(0, 4) !== 'sse:') {
          return
        }

        var listener = function (event) {
          if (maybeCloseSSESource(sourceElement)) {
            return
          }
          if (!api.bodyContains(elt)) {
            source.removeEventListener(ts.trigger.slice(4), listener)
          }
          // Trigger events to be handled by the rest of htmx
          htmx.trigger(elt, ts.trigger, event)
          htmx.trigger(elt, 'htmx:sseMessage', event)
        }

        // Register the new listener
        api.getInternalData(elt).sseEventListener = listener
        addSSEListener(elt, source, ts.trigger.slice(4), listener)
      })
    }
  }

  /**
   * ensureEventSourceOnElement creates a new EventSource connection on the provided element.
   * If a usable EventSource already exists, then it is returned.  If not, then a new EventSource
   * is created and stored in the element's internalData.
   * @param {HTMLElement} elt
   * @param {number} retryCount
   * @returns {EventSource | null}
   */
  function ensureEventSourceOnElement(elt, retryCount) {
    if (elt == null) {
      return null
    }

    // handle extension source creation attribute
    var sseURL = api.getAttributeValue(elt, 'sse-connect')
    if (sseURL) {
      ensureEventSource(elt, sseURL, retryCount)
    } else {
      // the element does not ask for a connection anymore, close the one it owned
      closeEventSource(elt, 'sourceReplaced')
    }

    registerSSE(elt)
  }

  /**
   * ensureEventSource connects the given element to the given url.
   *
   * If the element already is connected to that url and the connection is still
   * usable, then the existing EventSource is kept, and its reference is restored in
   * the element's internal data, which htmx wipes every time it processes the element.
   *
   * @param {HTMLElement} elt
   * @param {string} url
   * @param {number} retryCount
   */
  function ensureEventSource(elt, url, retryCount) {
    var closeAttribute = api.getAttributeValue(elt, 'sse-close')
    var previous = sseSources.get(elt)
    var replacedSource = false

    if (previous) {
      if (previous.source.readyState !== EventSource.CLOSED) {
        if (previous.url === url && previous.closeAttribute === closeAttribute) {
          // Already connected, keep the stream instead of opening a second one
          api.getInternalData(elt).sseEventSource = previous.source
          return
        }

        // The element asks for a different connection now, close the previous one
        closeEventSource(elt, 'sourceReplaced')
      }

      // Descendants are still listening on the source that is being replaced
      replacedSource = true
    }

    var source = htmx.createEventSource(url)

    source.onerror = function(err) {
      // Log an error event
      api.triggerErrorEvent(elt, 'htmx:sseError', { error: err, source })

      // If parent no longer exists in the document, then clean up this EventSource
      if (maybeCloseSSESource(elt)) {
        return
      }

      // Otherwise, try to reconnect the EventSource
      if (source.readyState === EventSource.CLOSED) {
        retryCount = retryCount || 0
        retryCount = Math.max(Math.min(retryCount * 2, 128), 1)
        var timeout = retryCount * 500
        window.setTimeout(function() {
          ensureEventSourceOnElement(elt, retryCount)
        }, timeout)
      }
    }

    source.onopen = function(evt) {
      api.triggerEvent(elt, 'htmx:sseOpen', { source })

      if (replacedSource || (retryCount && retryCount > 0)) {
        const childrenToFix = elt.querySelectorAll("[sse-swap], [data-sse-swap], [hx-trigger], [data-hx-trigger]")
        for (let i = 0; i < childrenToFix.length; i++) {
          registerSSE(childrenToFix[i])
        }
        replacedSource = false
        // We want to increase the reconnection delay for consecutive failed attempts only
        retryCount = 0
      }
    }

    api.getInternalData(elt).sseEventSource = source
    sseSources.set(elt, { source, url, closeAttribute })

    if (closeAttribute) {
      // close eventsource when this message is received
      source.addEventListener(closeAttribute, function() {
        api.triggerEvent(elt, 'htmx:sseClose', {
          source,
          type: 'message',
        })
        source.close()
      });
    }
  }

  /**
   * maybeCloseSSESource confirms that the parent element still exists.
   * If not, then any associated SSE source is closed and the function returns true.
   *
   * @param {HTMLElement} elt
   * @returns boolean
   */
  function maybeCloseSSESource(elt) {
    if (!api.bodyContains(elt)) {
      return closeEventSource(elt, 'nodeMissing')
    }
    return false
  }

  /**
   * addSSEListener starts listening for an event on the given source, and keeps track
   * of the listener so that it can be removed again.
   *
   * @param {HTMLElement} elt
   * @param {EventSource} source
   * @param {string} name
   * @param {Function} listener
   */
  function addSSEListener(elt, source, name, listener) {
    var listeners = sseListeners.get(elt)
    if (!listeners) {
      listeners = []
      sseListeners.set(elt, listeners)
    }

    listeners.push({ source, name, listener })
    source.addEventListener(name, listener)
  }

  /**
   * removeSSEListeners stops listening for every event this element was registered for.
   *
   * @param {HTMLElement} elt
   */
  function removeSSEListeners(elt) {
    var listeners = sseListeners.get(elt)
    if (!listeners) {
      return
    }

    for (var i = 0; i < listeners.length; i++) {
      listeners[i].source.removeEventListener(listeners[i].name, listeners[i].listener)
    }
    sseListeners.delete(elt)
  }

  /**
   * closeEventSource closes the EventSource that was created for the given element,
   * if there still is one, and reports the reason it was closed.
   *
   * The source is looked up in sseSources as well, because htmx wipes an element's
   * internal data whenever it processes that element again.
   *
   * @param {HTMLElement} elt
   * @param {string} type
   * @returns boolean whether a source was closed
   */
  function closeEventSource(elt, type) {
    var internalData = api.getInternalData(elt)
    var tracked = sseSources.get(elt)
    var source = internalData.sseEventSource || (tracked && tracked.source)
    if (!source) {
      return false
    }

    api.triggerEvent(elt, 'htmx:sseClose', {
      source,
      type,
    })
    source.close()
    sseSources.delete(elt)
    delete internalData.sseEventSource
    return true
  }


  /**
   * @param {HTMLElement} elt
   * @param {string} content
   */
  function swap(elt, content) {
    api.withExtensions(elt, function(extension) {
      content = extension.transformResponse(content, null, elt)
    })

    var swapSpec = api.getSwapSpecification(elt)
    var target = api.getTarget(elt)
    api.swap(target, content, swapSpec, { contextElement: elt })
  }


  function hasEventSource(node) {
    return api.getInternalData(node).sseEventSource != null
  }
})()
