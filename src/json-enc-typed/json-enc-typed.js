(function() {
  let api
  htmx.defineExtension('json-enc-typed', {
    init: function(apiRef) {
      api = apiRef
    },

    onEvent: function(name, evt) {
      if (name === 'htmx:configRequest') {
        evt.detail.headers['Content-Type'] = 'application/json'
      }
    },

    encodeParameters: async function(xhr, parameters, elt) {
      const object = {}
      xhr.overrideMimeType('text/json')

      for (const [key, value] of parameters.entries()) {
        const input = elt.querySelector(`[name="${key}"]`)
        const transformedValue = input ? convertValue(input, value, input.type) : value
        if (Object.hasOwn(object, key)) {
          if (!Array.isArray(object[key])) {
            object[key] = [object[key]]
          }
          object[key].push(transformedValue)
        } else {
          object[key] = transformedValue
        }
      }

      // FormData encodes values as strings, restore hx-vals/hx-vars with their initial types
      const vals = api.getExpressionVars(elt)
      Object.keys(object).forEach(function(key) {
        object[key] = Object.hasOwn(vals, key) ? vals[key] : object[key]
      })

      return (JSON.stringify(object))
    }
  })

  function convertValue(input, value, inputType) {
    if (inputType == 'number' || inputType == 'range') {
      return Array.isArray(value) ? value.map(Number) : Number(value)
    } else if (inputType === 'checkbox') {
      return true
    } else if (inputType === 'file') {
      return handleFileInput(input)
    }
    return value
  }

  function handleFileInput(input) {
    return new Promise((resolve) => {
      const file = input.files[0]
      const reader = new FileReader()
      reader.onloadend = function() {
        // Since it contains the Data URI, we should remove the prefix and keep only Base64 string
        const dataB64 = reader.result.replace(/^data:.+;base64,/, '')
        resolve(dataB64)
      }
      reader.readAsDataURL(file)
    })
  }

})()