## amz-content-sha256 - htmx Extension

### Overview

`amz-content-sha256` is a htmx extension that adds an additional header to POST and PUT requests made from a form. This header is called `x-amz-content-sha256` and it contains a SHA-256 hash of the form data. This extension is particularly useful for interacting with AWS services that require the content hash as part of the request for data integrity verification.

The extension computes the SHA-256 hash of the form data and attaches it to the request header, ensuring that the data sent is not tampered with in transit. This is especially important for certain AWS services that use this hash to validate the integrity of the data sent to APIs, such as AWS Lambda behind CloudFront.

### Why Do You Need This?

Some AWS services, like Lambda functions behind CloudFront, require clients to send a SHA-256 hash of the request data (e.g., form data) to ensure the integrity of the request. Without this hash, AWS might reject your requests, resulting in errors such as:

_Error Example_:

```json
{
  "message": "The request signature we calculated does not match the signature you provided. Check your AWS Secret Access Key and signing method. Consult the service documentation for details."
}
```

This issue can occur when using Lambda Function URLs behind CloudFront, as explained in this [Aws Community Post](https://repost.aws/questions/QUbHCI9AfyRdaUPCCo_3XKMQ/lambda-function-url-behind-cloudfront-invalidsignatureexception-only-on-post). See the [AWS Docs](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-lambda.html) that confirm that behaviour.

### How Does It Work?

1. Form Submission: When a form is submitted using a POST or PUT request, the extension calculates the SHA-256 hash of the form data.
2. Header Addition: The calculated hash is added to the request as the header x-amz-content-sha256.
3. Request Integrity: This header ensures that the data sent is valid and hasn't been altered, which is required for services such as Lambda behind CloudFront.

### Installation

1. Include the extension in your HTML page or JS file.
2. Add the tag hx-ext="amz-content-sha256" to your desired form or even the document body if you want this behaviour for all post and put requests.
3. Add a form element that will trigger a POST or PUT request.
4. When the form is submitted, the extension will automatically compute the SHA-256 hash and add the x-amz-content-sha256 header to the request.

_Example_:

```html
<form hx-post="/your-api-endpoint" hx-ext="amz-content-sha256">
  <input type="text" name="example" value="test" />
  <button type="submit">Submit</button>
</form>
```

`
