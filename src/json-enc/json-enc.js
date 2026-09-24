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
      // A hx-vals/hx-vars key whose value serializes to nothing in FormData (e.g. an
      // empty array) has no entry in `object` yet, so the key set to restore over must
      // be the union of both, not just what FormData produced.
      const keys = new Set(Object.keys(object).concat(Object.keys(vals)))
      keys.forEach(function(key) {
        // FormData encodes values as strings, restore hx-vals/hx-vars with their initial types
        object[key] = Object.hasOwn(vals, key) ? vals[key] : object[key]
      })

      return (JSON.stringify(object))
    }
  })
})()
