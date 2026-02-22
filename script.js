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

        // SPEED TUNING
        // 0.6 = 400ms
        // 0.9 = 200ms
        // 1.0 = 0ms (instant)
        // >1.0 = faster than instant (may cause issues)
        const speed = 0.9;
        const scrollDistance = chosenElement.clientHeight * speed; // was 0.5
        const scrollDelay = 200; // was 500ms

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