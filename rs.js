const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 3000;

// Static file serving
app.use(express.static(path.join(__dirname, "public")));

// Upload directories
const upload = multer({ dest: "uploads/" });
const compressedDir = path.join(__dirname, "compressed");

// Ensure the `compressed/` folder exists
if (!fs.existsSync(compressedDir)) {
    fs.mkdirSync(compressedDir);
}

// Compress route
app.post("/compress", upload.single("image"), async (req, res) => {
    try {
        const { fileType, maxFileSize, quality } = req.body;
        const filePath = req.file.path;
        const outputFileName = `compressed_${Date.now()}.${fileType}`;
        const outputPath = path.join(compressedDir, outputFileName);

        // Compress the image
        await sharp(filePath)
            .toFormat(fileType, { quality: parseInt(quality) })
            .toFile(outputPath);

        // Check file size
        const compressedSize = fs.statSync(outputPath).size / 1024;
        if (compressedSize > parseInt(maxFileSize)) {
            fs.unlinkSync(outputPath); // Delete oversized compressed file
            return res.status(400).send("Unable to compress within the specified size limit.");
        }

        // Send the compressed file
        res.sendFile(outputPath, () => {
            fs.unlinkSync(outputPath); // Delete after sending
            fs.unlinkSync(filePath);  // Delete original uploaded file
        });
    } catch (error) {
        res.status(500).send("Error processing image: " + error.message);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

