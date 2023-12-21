const sharp = require('sharp');
const fs = require('fs').promises; // Use promises-based fs

module.exports = {
  crop: async (req) => {
    console.log("Call comes");
    if (req.files && req.files.length > 0) {
      // Check if req.files is defined and has elements
      try {
        await Promise.all(req.files.map(async (file) => {
          const inputFilePath = file.path;

          const processedImageBuffer = await sharp(inputFilePath)
            .resize(150, 150, {
              kernel: sharp.kernel.nearest,
              fit: 'fill',
              position: 'right top',
            })
            .toBuffer();

          await fs.writeFile(inputFilePath, processedImageBuffer);
          console.log("Image cropped and saved successfully to ", inputFilePath);
        }));

        console.log("All images cropped and saved successfully.");
      } catch (error) {
        console.error("Error while cropping and saving images:", error);
      }
    } else {
      console.log("No files to process");
    }
  }
};
