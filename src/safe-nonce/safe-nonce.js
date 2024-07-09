htmx.defineExtension('safe-nonce', {
  transformResponse: function(text, xhr, elt) {
    if (htmx.config.inlineScriptNonce) {
      htmx.config.safeInlineScriptNonce = htmx.config.inlineScriptNonce
      htmx.config.inlineScriptNonce = ''
    }
    const nonce = xhr.getResponseHeader('HX-Nonce')
    if (htmx.config.safeInlineScriptNonce && nonce) {
      const escapedRegex = new RegExp(`nonce="${nonce.replace(/[\\\[\]\/^*.+?$(){}'#:!=|]/g, '\\$&')}"`, 'g')
      return text.replace(escapedRegex, `nonce="${htmx.config.safeInlineScriptNonce}"`)
    }
    return text
  }
})
