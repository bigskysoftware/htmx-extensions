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

      // group FormData parameters by key
      const groupedParameters = Array.from(parameters.entries()).reduce((grouped, [key, value]) => {
        if (Object.hasOwn(grouped, key)) {
          if (!Array.isArray(grouped[key])) {
            grouped[key] = [grouped[key]]
          }
          grouped[key].push(value)
        } else {
          grouped[key] = value
        }
        return grouped;
      }, {});

      const vals = api.getExpressionVars(elt)
      const object = Object.fromEntries(
          Object.entries(groupedParameters).map(([key, value]) => {
            // FormData encodes values as strings, restore hx-vals/hx-vars with their initial types
            const typedValue = Object.hasOwn(vals, key) ? vals[key] : value
            return [key, typedValue]
          })
      )

      return (JSON.stringify(object))
    }
  })
})()
