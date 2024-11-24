htmx.defineExtension("amz-content-sha256", {
  init: function () {
    /**
     * The `init` method is called when the extension is initialized.
     * It sets up an object `RequestHashQueue` that will store SHA-256 hashes for each POST/PUT request,
     * categorized by the request path.
     * It also defines an asynchronous function `calculateSHA256` that computes the SHA-256 hash required by AWS
     * for data integrity verification.
     */
    this.RequestHashQueue = {}; // Queue to store hashes for each request path.

    this.calculateSHA256 = async (data) => {
      // Convert the data into a byte array using TextEncoder
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      // Calculate the SHA-256 hash of the data
      const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);

      // Convert the hash buffer into a hexadecimal string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

      return hashHex; // Return the hex representation of the SHA-256 hash
    };

    return null; // Nothing needs to be returned from `init`
  },

  onEvent: async function (name, e) {
    switch (name) {
      case "htmx:confirm":
        /**
         * This event is triggered when a form submission is confirmed.
         * If the request method is POST or PUT, we process the form data and calculate its SHA-256 hash.
         * The hash is then added to the `RequestHashQueue` for the specific request path.
         * If the queue already exists for that path, the new hash is appended to the queue.
         */
        if (e.detail.verb == "post" || e.detail.verb == "put") {
          e.preventDefault(); // Prevent the default form submission to handle it programmatically.

          const form = e.target; // The form element that triggered the event.

          // Ensure the target is a valid HTMLFormElement
          if (form instanceof HTMLFormElement) {
            // Create a FormData object from the form, and convert it into a URLSearchParams string
            const formData = new FormData(form);
            const data = new URLSearchParams(formData).toString();

            // Calculate the SHA-256 hash of the form data
            const sha256Hash = await this.calculateSHA256(data);

            // Check if there's already a hash queue for this path, and either initialize or append to it
            if (!this.RequestHashQueue[e.detail.path]) {
              this.RequestHashQueue[e.detail.path] = [sha256Hash];
            } else {
              this.RequestHashQueue[e.detail.path].push(sha256Hash);
            }
          }

          // Proceed with the request after processing the form data and hash
          e.detail.issueRequest();
        }
        break;

      case "htmx:configRequest":
        /**
         * Before the actual request is sent to AWS, if it is a POST or PUT request,
         * this event is triggered. Here, we retrieve the SHA-256 hash from the `RequestHashQueue`
         * and add it to the request headers under the name `x-amz-content-sha256`.
         * This header is necessary for AWS services to validate the integrity of the request payload.
         */
        if (e.detail.verb == "post" || e.detail.verb == "put") {
          // If there is a hash in the queue for the current request path, add it to the request header
          if (this.RequestHashQueue[e.detail.path].length > 0)
            e.detail.headers["x-amz-content-sha256"] =
              this.RequestHashQueue[e.detail.path].pop();
        }
        break;
    }
  },
});
