(function() {
  function splitOnWhitespace(trigger) {
    return trigger.split(/\s+/)
  }

  function parseClassOperation(trimmedValue) {
    var split = splitOnWhitespace(trimmedValue)
    if (split.length > 1) {
      var operation = split[0]
      var classDef = split[1].trim()
      var cssClass
      var delay
      if (classDef.indexOf(':') > 0) {
        var splitCssClass = classDef.split(':')
        cssClass = splitCssClass[0]
        delay = splitCssClass[1] === '!' ? null : htmx.parseInterval(splitCssClass[1])
      } else {
        cssClass = classDef
        delay = 100
      }
      return {
        operation,
        cssClass,
        delay
      }
    } else {
      return null
    }
  }

  function call(elt, classOperation) {
    elt.classList[classOperation.operation].call(elt.classList, classOperation.cssClass)
  }
  
  function performOperation(elt, classOperation, currentRunTime) {
    setTimeout(function() {
      call(elt, classOperation)
    }, currentRunTime)
  }

  function toggleOperation(elt, classOperation, currentRunTime) {
    setTimeout(function() {
      setInterval(function() {
        call(elt, classOperation)
      }, classOperation.delay)
    }, currentRunTime)
  }

  function processClassList(elt, classList) {
    var runs = classList.split('&')
    for (var i = 0; i < runs.length; i++) {
      var run = runs[i]
      var currentRunTime = 0
      var classOperations = run.split(',')
      for (var j = 0; j < classOperations.length; j++) {
        var value = classOperations[j]
        var trimmedValue = value.trim()
        var classOperation = parseClassOperation(trimmedValue)
        if (classOperation) {
          if (classOperation.operation === 'toggle') {
            if (classOperation.delay) {
              toggleOperation(elt, classOperation, currentRunTime)
              currentRunTime += classOperation.delay
            } else {
              call(elt, classOperation)
            }
          } else {
            currentRunTime += classOperation.delay
            performOperation(elt, classOperation, currentRunTime)
          }
        }
      }
    }
  }

  function maybeProcessClasses(elt) {
    if (elt.getAttribute) {
      var classList = elt.getAttribute('classes') || elt.getAttribute('data-classes')
      var eventTrigger = elt.getAttribute('classes-event-trigger') || elt.getAttribute('data-classes-event-trigger')
      if (eventTrigger) {
        var handleEvent = function() {
          processClassList(elt, classList)
          elt.removeEventListener(eventTrigger, handleEvent)
        }
        elt.addEventListener(eventTrigger, handleEvent, { once: true })
        document.addEventListener(eventTrigger, handleEvent)
      } else if (classList) {
        processClassList(elt, classList)
      }
    }
  }

  htmx.defineExtension('class-tools', {
    onEvent: function(name, evt) {
      if (name === 'htmx:afterProcessNode') {
        var elt = evt.detail.elt
        maybeProcessClasses(elt)
        var classList = elt.getAttribute('apply-parent-classes') || elt.getAttribute('data-apply-parent-classes')
        if (classList) {
          var parent = elt.parentElement
          parent.removeChild(elt)
          parent.setAttribute('classes', classList)
          maybeProcessClasses(parent)
        } else if (elt.querySelectorAll) {
          var children = elt.querySelectorAll('[classes], [data-classes], [classes-event-trigger], [data-classes-event-trigger]')
          for (var i = 0; i < children.length; i++) {
            maybeProcessClasses(children[i])
          }
        }
      }
    }
  })
})()
