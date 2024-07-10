htmx.defineExtension('safe-nonce', {
  transformResponse: function(text, xhr, elt) {
    if (htmx.config.inlineScriptNonce) {
      htmx.config.inlineScriptNonce = '' // disable normal htmx nonce replacment so safe-nonce can do it instead
    }
    if (!htmx.config.refreshOnHistoryMiss) { 
      htmx.config.refreshOnHistoryMiss = true // disable ajax fetching on history miss because it doesn't handle nonce replacment
    }
    const nonce = xhr.getResponseHeader('HX-Nonce')
    const pageNonce = htmx.config.safeInlineScriptNonce
    if (pageNonce && pageNonce != nonce) {
      // Protect from nonce reuse attacks by stripping all original page load nonces
      const escapedPageNonce = new RegExp(`nonce="${pageNonce.replace(/[\\\[\]\/^*.+?$(){}'#:!=|]/g, '\\$&')}"`, 'g')
      text = text.replace(escapedPageNonce, '')
    }
    if (pageNonce && nonce) {
      // Escape nonce value to make it safe as a RegEx and then swap the trusted nonce to the page load nonce to allow them to pass CSP checks
      const escapedNonce = new RegExp(`nonce="${nonce.replace(/[\\\[\]\/^*.+?$(){}'#:!=|]/g, '\\$&')}"`, 'g')
      return text.replace(escapedNonce, `nonce="${pageNonce}"`)
    }
    return text
  }
})