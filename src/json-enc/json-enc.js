(function() {
  let api
  htmx.defineExtension('json-enc', {
    init: function(apiRef) {
      api = apiRef
    },

    onEvent: function(name, evt) {
      if (name === 'htmx:configRequest') {
        evt.detail.headers['Content-Type'] = 'application/json'
      }
    },

    encodeParameters: function(xhr, parameters, elt) {
      xhr.overrideMimeType('text/json')

      const object = {}
      parameters.forEach(function(value, key) {
        if (Object.hasOwn(object, key)) {
          if (!Array.isArray(object[key])) {
            object[key] = [object[key]]
          }
          object[key].push(value)
        } else {
          object[key] = value
        }
      })

      const vals = api.getExpressionVars(elt)
      Object.keys(object).forEach(function(key) {
        // FormData encodes values as strings, restore hx-vals/hx-vars with their initial types
        object[key] = Object.hasOwn(vals, key) ? vals[key] : object[key]
      })

      return (JSON.stringify(object))
    }
  })
})()
