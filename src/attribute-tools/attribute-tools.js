(function() {
  function splitOnWhitespace(trigger) {
    return trigger.split(/\s+/)
  }
  
  function parseAttributeOperation(trimmedValue) {
    var split = splitOnWhitespace(trimmedValue)
    if (split.length > 1) {
      var operation = split[0]
      var attributeDef = split[1].trim()
      var attribute
      var delay
      if (attributeDef.indexOf(':') > 0) {
        var splitAttribute = attributeDef.split(':')
        attribute = splitAttribute[0]
        delay = htmx.parseInterval(splitAttribute[1])
      } else {
        attribute = attributeDef
        delay = 0
      }
      return {
        operation,
        attribute,
        delay
      }
    } else {
      return null
    }
  }

  function setOperation(elt, attributeOperation, attributeList, currentRunTime) {
    setTimeout(function() {
      if (attributeOperation) {
        var split = attributeOperation.attribute.split(/=/)
        var name = split[0]
        var value = split.length > 1 ? split[1] : ''
        elt.setAttribute(name, value)
      }
      
    }, currentRunTime)
  }

  function removeOperation(elt, attributeOperation, attributeList, currentRunTime) {
    setTimeout(function() {
      if (attributeOperation) {
        var split = attributeOperation.attribute.split(/=/)
        var name = split[0]
        var value = split.length > 1 ? split[1] : ''
        elt.removeAttribute(name)
      }
      
    }, currentRunTime)
  }

  function processAttributeList(elt, attributeList) {
    var runs = attributeList.split('&')
    for (var i = 0; i < runs.length; i++) {
      var run = runs[i]
      var currentRunTime = 0
      var attributeOperations = run.split(',')
      for (var j = 0; j < attributeOperations.length; j++) {
        var value = attributeOperations[j]
        var trimmedValue = value.trim()
        var attributeOperation = parseAttributeOperation(trimmedValue)
        if (attributeOperation) {
          if (attributeOperation.operation === 'remove') {
            currentRunTime = currentRunTime + attributeOperation.delay
            removeOperation(elt, attributeOperation, attributeList, currentRunTime)
          } else if (attributeOperation.operation === 'set') {
            currentRunTime = currentRunTime + attributeOperation.delay
            setOperation(elt, attributeOperation, attributeList, currentRunTime)
          }
        }
      }
    }
  }

  function maybeProcessAttributes(elt) {
    if (elt.getAttribute) {
      var attributeList = elt.getAttribute('attributes') || elt.getAttribute('data-attributes')
      if (attributeList) {
        processAttributeList(elt, attributeList)
      }
    }
  }

  htmx.defineExtension('attribute-tools', {
    onEvent: function(name, evt) {
      if (name === 'htmx:afterProcessNode') {
        var elt = evt.detail.elt
        maybeProcessAttributes(elt)
        var attributeList = elt.getAttribute("apply-parent-attributes") || elt.getAttribute("data-apply-parent-attributes");
        if (attributeList) {
          var parent = elt.parentElement;
          parent.removeChild(elt);
          parent.setAttribute("data-attributes", attributeList);
          maybeProcessAttributes(parent);
        } else if (elt.querySelectorAll) {
          var children = elt.querySelectorAll('[attributes], [data-attributes]')
          for (var i = 0; i < children.length; i++) {
            maybeProcessAttributes(children[i])
          }
        }
      }
    }
  })
})()
