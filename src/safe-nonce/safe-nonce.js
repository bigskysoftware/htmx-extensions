htmx.defineExtension('safe-nonce', {
  transformResponse: function(text, xhr, elt) {
    let config = htmx.config
    config.inlineScriptNonce = '' // disable normal htmx nonce replacment so safe-nonce can do it instead
    config.refreshOnHistoryMiss = true // disable ajax fetching on history miss because it doesn't handle nonce replacment
    const nonce = xhr.getResponseHeader('HX-Nonce')
    const pageNonce = config.safeInlineScriptNonce
    function escapeNonce(nonce) {
      return new RegExp(`nonce="${nonce.replace(/[\\\[\]\/^*.+?$(){}'#:!=|]/g, '\\$&')}"`, 'g')
    }
    if (pageNonce && pageNonce != nonce) {
      // Protect from nonce reuse attacks by striping all original page load nonces
      text = text.replace(escapeNonce(pageNonce), '')
    }
    if (pageNonce && nonce) {
      // Escape nonce value to make it safe as a RegEx and then swap the trusted nonce to the page load nonce to allow them to pass CSP checks
      return text.replace(escapeNonce(nonce), `nonce="${pageNonce}"`)
    }
    return text
  }
})