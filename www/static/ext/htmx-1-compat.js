(function() {
  let api

  htmx.defineExtension('htmx-1-compat', {
    init: function(apiRef) {
      api = apiRef

      htmx.config.scrollBehavior = 'smooth'
      htmx.config.methodsThatUseUrlParams = ['get']
      htmx.config.selfRequestsOnly = false

      if (!htmx.createEventSource) {
        htmx.createEventSource = createEventSource
      }
      if (!htmx.createWebSocket) {
        htmx.createWebSocket = createWebSocket
      }
    },
    onEvent: function(name, evt) {
      switch (name) {
        case 'htmx:beforeCleanupElement': {
          const internalData = api.getInternalData(evt.target)
          if (internalData.sseEventSource) {
            internalData.sseEventSource.close()
          }
          if (internalData.webSocket) {
            internalData.webSocket.close()
          }
          break
        }
        case 'htmx:afterProcessNode': {
          forEach(queryAttributeOnThisOrChildren(evt.target, 'hx-sse'), function(elt) {
            const internalData = api.getInternalData(elt)
            const sseInfo = api.getAttributeValue(elt, 'hx-sse')
            if (sseInfo) {
              processSSEInfo(elt, internalData, sseInfo)
            }
          })

          forEach(queryAttributeOnThisOrChildren(evt.target, 'hx-trigger'), function(elt) {
            parseSSETrigger(elt)
          })

          forEach(queryAttributeOnThisOrChildren(evt.target, 'hx-ws'), function(elt) {
            const internalData = api.getInternalData(elt)
            const wsInfo = api.getAttributeValue(elt, 'hx-ws')
            if (wsInfo) {
              processWebSocketInfo(elt, internalData, wsInfo)
            }
          })

          forEach(queryAttributeOnThisOrChildren(evt.target, 'hx-on'), processHxOn)
          break
        }
      }
    }
  })

  /**
   * queryAttributeOnThisOrChildren returns all nodes that contain the requested attributeName, INCLUDING THE PROVIDED ROOT ELEMENT.
   *
   * @param {HTMLElement} elt
   * @param {string} attributeName
   */
  function queryAttributeOnThisOrChildren(elt, attributeName) {
    const result = []

    // If the parent element also contains the requested attribute, then add it to the results too.
    if (api.hasAttribute(elt, attributeName) || api.hasAttribute(elt, 'hx-ws')) {
      result.push(elt)
    }

    // Search all child nodes that match the requested attribute
    elt.querySelectorAll('[' + attributeName + '], [data-' + attributeName + '], [data-hx-ws], [hx-ws]').forEach(function(node) {
      result.push(node)
    })

    return result
  }

  /**
   * @template T
   * @param {T[]} arr
   * @param {(T) => void} func
   */
  function forEach(arr, func) {
    if (arr) {
      for (let i = 0; i < arr.length; i++) {
        func(arr[i])
      }
    }
  }

  // region Web Sockets

  function createWebSocket(url) {
    const sock = new WebSocket(url, [])
    sock.binaryType = htmx.config.wsBinaryType
    return sock
  }

  function processWebSocketInfo(elt, nodeData, info) {
    const values = splitOnWhitespace(info)
    for (let i = 0; i < values.length; i++) {
      const value = values[i].split(/:(.+)/)
      if (value[0] === 'connect') {
        ensureWebSocket(elt, value[1], 0)
      }
      if (value[0] === 'send') {
        processWebSocketSend(elt)
      }
    }
  }

  function ensureWebSocket(elt, wssSource, retryCount) {
    if (!api.bodyContains(elt)) {
      return // stop ensuring websocket connection when socket bearing element ceases to exist
    }

    if (wssSource.indexOf('/') === 0) { // complete absolute paths only
      const base_part = location.hostname + (location.port ? ':' + location.port : '')
      if (location.protocol === 'https:') {
        wssSource = 'wss://' + base_part + wssSource
      } else if (location.protocol === 'http:') {
        wssSource = 'ws://' + base_part + wssSource
      }
    }
    const socket = htmx.createWebSocket(wssSource)
    socket.onerror = function(e) {
      api.triggerErrorEvent(elt, 'htmx:wsError', {
        error: e,
        socket
      })
      maybeCloseWebSocketSource(elt)
    }

    socket.onclose = function(e) {
      if ([1006, 1012, 1013].indexOf(e.code) >= 0) { // Abnormal Closure/Service Restart/Try Again Later
        const delay = getWebSocketReconnectDelay(retryCount)
        setTimeout(function() {
          ensureWebSocket(elt, wssSource, retryCount + 1) // creates a websocket with a new timeout
        }, delay)
      }
    }
    socket.onopen = function() {
      retryCount = 0
    }

    api.getInternalData(elt).webSocket = socket
    socket.addEventListener('message', function(event) {
      if (maybeCloseWebSocketSource(elt)) {
        return
      }

      let response = event.data
      api.withExtensions(elt, function(extension) {
        response = extension.transformResponse(response, null, elt)
      })

      const settleInfo = api.makeSettleInfo(elt)
      const fragment = api.makeFragment(response)
      const children = toArray(fragment.children)
      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        api.oobSwap(api.getAttributeValue(child, 'hx-swap-oob') || 'true', child, settleInfo)
      }

      api.settleImmediately(settleInfo.tasks)
    })
  }

  function maybeCloseWebSocketSource(elt) {
    if (!api.bodyContains(elt)) {
      api.getInternalData(elt).webSocket.close()
      return true
    }
  }

  function processWebSocketSend(elt) {
    const webSocketSourceElt = api.getClosestMatch(elt, function(parent) {
      return api.getInternalData(parent).webSocket != null
    })
    if (webSocketSourceElt) {
      elt.addEventListener(api.getTriggerSpecs(elt)[0].trigger, function(evt) {
        const webSocket = api.getInternalData(webSocketSourceElt).webSocket
        const headers = api.getHeaders(elt, webSocketSourceElt)
        const results = api.getInputValues(elt, 'post')
        const errors = results.errors
        const rawParameters = results.values
        const expressionVars = api.getExpressionVars(elt)
        const allParameters = api.mergeObjects(rawParameters, expressionVars)
        let filteredParameters = api.filterValues(allParameters, elt)
        filteredParameters = Object.assign({}, filteredParameters)
        filteredParameters.HEADERS = headers
        if (errors && errors.length > 0) {
          api.triggerEvent(elt, 'htmx:validation:halted', errors)
          return
        }
        webSocket.send(JSON.stringify(filteredParameters))
        if (api.shouldCancel(evt, elt)) {
          evt.preventDefault()
        }
      })
    } else {
      api.triggerErrorEvent(elt, 'htmx:noWebSocketSourceError')
    }
  }

  function getWebSocketReconnectDelay(retryCount) {
    const delay = htmx.config.wsReconnectDelay
    if (typeof delay === 'function') {
      // @ts-ignore
      return delay(retryCount)
    }
    if (delay === 'full-jitter') {
      const exp = Math.min(retryCount, 6)
      const maxDelay = 1000 * Math.pow(2, exp)
      return maxDelay * Math.random()
    }
    logError('htmx.config.wsReconnectDelay must either be a function or the string "full-jitter"')
  }

  function splitOnWhitespace(trigger) {
    return trigger.trim().split(/\s+/)
  }

  function toArray(arr) {
    const returnArr = []
    if (arr) {
      for (let i = 0; i < arr.length; i++) {
        returnArr.push(arr[i])
      }
    }
    return returnArr
  }

  function logError(msg) {
    if (console.error) {
      console.error(msg)
    } else if (console.log) {
      console.log('ERROR: ', msg)
    }
  }

  // endregion

  // region Server Sent Events

  function createEventSource(url) {
    return new EventSource(url, { withCredentials: true })
  }

  function processSSEInfo(elt, nodeData, info) {
    const values = splitOnWhitespace(info)
    for (let i = 0; i < values.length; i++) {
      const value = values[i].split(/:(.+)/)
      if (value[0] === 'connect') {
        processSSESource(elt, value[1])
      }

      if ((value[0] === 'swap')) {
        processSSESwap(elt, value[1])
      }
    }
  }

  function processSSESource(elt, sseSrc) {
    const source = htmx.createEventSource(sseSrc)
    source.onerror = function(e) {
      api.triggerErrorEvent(elt, 'htmx:sseError', {
        error: e,
        source
      })
      maybeCloseSSESource(elt)
    }
    api.getInternalData(elt).sseEventSource = source
  }

  function processSSESwap(elt, sseEventName) {
    const sseSourceElt = api.getClosestMatch(elt, hasEventSource)
    if (sseSourceElt) {
      const sseEventSource = api.getInternalData(sseSourceElt).sseEventSource
      const sseListener = function(event) {
        if (maybeCloseSSESource(sseSourceElt)) {
          return
        }
        if (!api.bodyContains(elt)) {
          sseEventSource.removeEventListener(sseEventName, sseListener)
          return
        }

        /// ////////////////////////
        // TODO: merge this code with AJAX and WebSockets code in the future.

        let response = event.data
        api.withExtensions(elt, function(extension) {
          response = extension.transformResponse(response, null, elt)
        })

        const swapSpec = api.getSwapSpecification(elt, null)
        const target = api.getTarget(elt)

        htmx.swap(target, response, swapSpec)
        api.triggerEvent(elt, 'htmx:sseMessage', event)
      }

      api.getInternalData(elt).sseListener = sseListener
      sseEventSource.addEventListener(sseEventName, sseListener)
    } else {
      api.triggerErrorEvent(elt, 'htmx:noSSESourceError')
    }
  }

  function parseSSETrigger(elt) {
    const explicitTrigger = api.getAttributeValue(elt, 'hx-trigger')
    if (!explicitTrigger) {
      return
    }
    const prefix = 'sse:'
    let sseIndex = explicitTrigger.indexOf(prefix)
    while (sseIndex >= 0) {
      sseIndex += prefix.length
      let endIndex = sseIndex + explicitTrigger.substring(sseIndex).search(/[,\[\s]/)
      if (endIndex < sseIndex) {
        endIndex = explicitTrigger.length
      }

      const sseEventName = explicitTrigger.substring(sseIndex, endIndex)
      processSSETrigger(elt, function() {
        api.triggerEvent(elt, prefix + sseEventName)
      }, sseEventName)

      sseIndex = explicitTrigger.indexOf(prefix, sseIndex + prefix.length)
    }
  }

  function processSSETrigger(elt, handler, sseEventName) {
    const sseSourceElt = api.getClosestMatch(elt, hasEventSource)
    if (sseSourceElt) {
      const sseEventSource = api.getInternalData(sseSourceElt).sseEventSource
      const sseListener = function() {
        if (!maybeCloseSSESource(sseSourceElt)) {
          if (api.bodyContains(elt)) {
            handler(elt)
          } else {
            sseEventSource.removeEventListener(sseEventName, sseListener)
          }
        }
      }
      api.getInternalData(elt).sseListener = sseListener
      sseEventSource.addEventListener(sseEventName, sseListener)
    } else {
      api.triggerErrorEvent(elt, 'htmx:noSSESourceError')
    }
  }

  function maybeCloseSSESource(elt) {
    if (!api.bodyContains(elt)) {
      api.getInternalData(elt).sseEventSource.close()
      return true
    }
  }

  function hasEventSource(node) {
    return api.getInternalData(node).sseEventSource != null
  }

  // endregion

  // region hx-on

  function processHxOn(elt) {
    const hxOnValue = api.getAttributeValue(elt, 'hx-on')
    if (hxOnValue) {
      const handlers = {}
      const lines = hxOnValue.split('\n')
      let currentEvent = null
      let curlyCount = 0
      while (lines.length > 0) {
        const line = lines.shift()
        const match = line.match(/^\s*([a-zA-Z:\-.]+:)(.*)/)
        if (curlyCount === 0 && match) {
          line.split(':')
          currentEvent = match[1].slice(0, -1) // strip last colon
          handlers[currentEvent] = match[2]
        } else {
          handlers[currentEvent] += line
        }
        curlyCount += countCurlies(line)
      }

      for (const eventName in handlers) {
        addHxOnEventHandler(elt, eventName, handlers[eventName])
      }
    }
  }

  function addHxOnEventHandler(elt, eventName, code) {
    const nodeData = api.getInternalData(elt)
    if (!Array.isArray(nodeData.onHandlers)) {
      nodeData.onHandlers = []
    }
    let func
    const listener = function(e) {
      return maybeEval(elt, function() {
        if (!func) {
          func = new Function('event', code)
        }
        func.call(elt, e)
      })
    }
    elt.addEventListener(eventName, listener)
    nodeData.onHandlers.push({
      event: eventName,
      listener
    })
  }

  function countCurlies(line) {
    const tokens = tokenizeString(line)
    let netCurlies = 0
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      if (token === '{') {
        netCurlies++
      } else if (token === '}') {
        netCurlies--
      }
    }
    return netCurlies
  }

  const SYMBOL_START = /[_$a-zA-Z]/
  const SYMBOL_CONT = /[_$a-zA-Z0-9]/
  const STRINGISH_START = ['"', '\'', '/']

  function tokenizeString(str) {
    const tokens = []
    let position = 0
    while (position < str.length) {
      if (SYMBOL_START.exec(str.charAt(position))) {
        const startPosition = position
        while (SYMBOL_CONT.exec(str.charAt(position + 1))) {
          position++
        }
        tokens.push(str.substr(startPosition, position - startPosition + 1))
      } else if (STRINGISH_START.indexOf(str.charAt(position)) !== -1) {
        const startChar = str.charAt(position)
        const startPosition = position
        position++
        while (position < str.length && str.charAt(position) !== startChar) {
          if (str.charAt(position) === '\\') {
            position++
          }
          position++
        }
        tokens.push(str.substr(startPosition, position - startPosition + 1))
      } else {
        const symbol = str.charAt(position)
        tokens.push(symbol)
      }
      position++
    }
    return tokens
  }

  function maybeEval(elt, toEval, defaultVal) {
    if (htmx.config.allowEval) {
      return toEval()
    } else {
      api.triggerErrorEvent(elt, 'htmx:evalDisallowedError')
      return defaultVal
    }
  }

  // endregion
})()
