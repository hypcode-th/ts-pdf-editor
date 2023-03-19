# ts-pdf-editor

## THIS PROJECT DOES NOT PROVIDE THE USER INTERFACE OF PDF EDITOR. 


## Objective
This is an experimental project with the purpose to store the PDF elements separately from the PDF file. We defines the Document class to keep the elements such as Text, Image, Shapes and Fields, separated from the PDF file. Not only the elements, but also the page information of the PDF document can be store in the Document object. Thus, we can modify the elements, change the page configuration etc., and save such information in the database, while the original PDF file can be stored separately in the storage service such as AWS S3 or Google Cloud Storage. We also provide the function to generate the final PDF with [PDF-LIB](https://pdf-lib.js.org/).

For the Signature element, it will be geneated as a rectangle element with anchor string (the anchor string will be the signerId of the Signature element) on the top left of the field. The color of the anchor string will be the same as the background color of the signature field so you won't see it. So, you can use it with [DocuSign eSign API](https://developers.docusign.com/docs/esign-rest-api/reference/) by setting the anchorString of SignHere tab to the signerId of the Signature element.

AS THE PROJECT IS IN AN EXPERIMENTAL PHASE, WE CAN CHANGE ANYTHING AT ANYTIME!!!

## License
[Click here to see the license](LICENSE)