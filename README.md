# Google-Drive-View-Only-PDF-Script-Downloader

Here you can use this script to download view only pdf file from Google Drive. This script works like a screenshot capturing all pdf pages to bulk of images with better resolution quality and combine it all into one pdf file.

**✨ Now with Auto-Scrolling!** - The script automatically scrolls through your entire PDF to load all images. No manual scrolling needed!

### Big-Note: Use this script wisely!

### Instruction
1. Open the PDF from Google Drive,
2. Click Preview,
3. Then on top right page click on three vertical dots menu -> Open in new window,
4. Inspect element your browser and go to console tab,
5. Type `allow pasting` and press ENTER, if you are using Chrome and cannot paste any code directly in the console tab,
6. Copy and paste script below on console tab,
   ```js
   (function () {
       console.log("Loading script ...");

       function autoScrollToLoadImages() {
           return new Promise((resolve) => {
               autoScrollDriveViewer(resolve);
           });
       }

       // Function to auto-scroll and load all images
       function autoScrollDriveViewer(callback) {
           let allElements = document.querySelectorAll("*");
           let chosenElement = null;
           let maxScrollHeight = 0;

           // Detect scrollable container
           for (let el of allElements) {
               if (el.scrollHeight > el.clientHeight && el.scrollHeight > maxScrollHeight) {
                   maxScrollHeight = el.scrollHeight;
                   chosenElement = el;
               }
           }

           if (!chosenElement) {
               console.log("No scrollable element found.");
               callback();
               return;
           }

           console.log("Fast scrolling element:", chosenElement);

           // 🔥 SPEED TUNING
           // 0.6 = 400ms (slower, for very large PDFs)
           // 0.9 = 200ms (recommended, balanced)
           // 1.0 = 0ms (instant, for small PDFs)
           // >1.0 = faster than instant (may cause issues)
           const speed = 0.9;
           const scrollDistance = chosenElement.clientHeight * speed;
           const scrollDelay = 200;

           let scrollPosition = 0;

           function scrollStep() {
               scrollPosition += scrollDistance;
               chosenElement.scrollTo(0, scrollPosition);

               if (scrollPosition + chosenElement.clientHeight < chosenElement.scrollHeight) {
                   setTimeout(scrollStep, scrollDelay);
               } else {
                   console.log("Fast scrolling finished.");
                   setTimeout(callback, 1200); // small wait for last lazy load
               }
           }

           scrollStep();
       }

       let script = document.createElement("script");
       script.onload = function () {
           const { jsPDF } = window.jspdf;

           // Auto-scroll to load all images first
           autoScrollToLoadImages().then(function () {
               // Generate a PDF from images with "blob:" sources.
               let pdf = null;
               let imgElements = document.getElementsByTagName("img");
               let validImgs = [];

               console.log("Scanning content ...");
               for (let i = 0; i < imgElements.length; i++) {
                   let img = imgElements[i];

                   // specific check for Google Drive blob images
                   let checkURLString = "blob:https://drive.google.com/";
                   if (img.src.substring(0, checkURLString.length) !== checkURLString) {
                       continue;
                   }

                   validImgs.push(img);
               }

               console.log(`${validImgs.length} content found!`);
               console.log("Generating PDF file ...");

               for (let i = 0; i < validImgs.length; i++) {
                   let img = validImgs[i];

                   // Convert image to DataURL via Canvas
                   let canvasElement = document.createElement("canvas");
                   let con = canvasElement.getContext("2d");
                   canvasElement.width = img.naturalWidth;
                   canvasElement.height = img.naturalHeight;
                   con.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
                   let imgData = canvasElement.toDataURL();

                   // Determine orientation and dimensions for THIS specific image
                   let orientation = img.naturalWidth > img.naturalHeight ? "l" : "p";
                   let pageWidth = img.naturalWidth;
                   let pageHeight = img.naturalHeight;

                   if (i === 0) {
                       // Initialize PDF with the dimensions of the FIRST image
                       pdf = new jsPDF({
                           orientation: orientation,
                           unit: "px",
                           format: [pageWidth, pageHeight],
                       });
                   } else {
                       // For subsequent images, add a new page with THAT image's specific dimensions
                       pdf.addPage([pageWidth, pageHeight], orientation);
                   }

                   // Add the image to the current page
                   pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight, "", "SLOW");

                   const percentages = Math.floor(((i + 1) / validImgs.length) * 100);
                   console.log(`Processing content ${percentages}%`);
               }

               // Check if title contains .pdf in end of the title
               // Use optional chaining to avoid errors if the meta tag isn't present.
               // Fall back to document.title when necessary. Note: if the PDF is inside a cross-origin iframe,
               // parent scripts cannot access the iframe document due to same-origin policy.
               let title = document.querySelector('meta[itemprop="name"]')?.content || document.title || 'download.pdf';
               if ((title.split(".").pop() || "").toLowerCase() !== "pdf") {
                   title = title + ".pdf";
               }

               // Download the generated PDF.
               console.log("Downloading PDF file ...");
               pdf.save(title, { returnPromise: true }).then(() => {
                   document.body.removeChild(script);
                   console.log("PDF downloaded!");
               });
           });
       };

       // Load the jsPDF library using the trusted URL.
       let scriptURL = "https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js";
       let trustedURL;
       if (window.trustedTypes && trustedTypes.createPolicy) {
           const policy = trustedTypes.createPolicy("myPolicy", {
               createScriptURL: (input) => {
                   return input;
               },
           });
           trustedURL = policy.createScriptURL(scriptURL);
       } else {
           trustedURL = scriptURL;
       }

       script.src = trustedURL;
       document.body.appendChild(script);
   })();
   ```
7. Wait for the script to auto-scroll and process your PDF file,
8. Enjoy your downloaded PDF!

### ⚙️ Adjusting Scroll Speed for Large PDFs

If you have a **very large PDF** and images aren't loading completely, you can adjust the scroll speed:

Find this section in the script:
```js
// 🔥 SPEED TUNING
// 0.6 = 400ms (slower, for very large PDFs)
// 0.9 = 200ms (recommended, balanced)
// 1.0 = 0ms (instant, for small PDFs)
// >1.0 = faster than instant (may cause issues)
const speed = 0.9;
```

- **For very large PDFs (100+ pages):** Change `speed` to `0.6` for slower scrolling
- **For small PDFs (< 30 pages):** Change `speed` to `1.0` for faster processing
- **For medium PDFs (30-100 pages):** Keep the default `0.9`

### How It Works

1. Script loads the jsPDF library
2. **Automatically scrolls through the entire PDF** to trigger lazy-loading of all images
3. Captures all visible images from Google Drive viewer
4. Converts images to high-quality PNG format
5. Generates a new PDF with all pages
6. Downloads the file with the original PDF name

### Source Reference
This script is modified with source from :
- [mhsohan/How-to-download-protected-view-only-files-from-google-drive-](https://github.com/mhsohan/How-to-download-protected-view-only-files-from-google-drive-)
- [zeltox/Google-Drive-PDF-Downloader](https://github.com/zeltox/Google-Drive-PDF-Downloader)
