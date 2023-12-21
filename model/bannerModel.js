const mongoose = require("mongoose")

const bannerSchema = new mongoose.Schema({
    titleOne: {
        type: String,
        required: true,
    },
    titleTwo: {
        type: String,
        required: true,
    },
    titleThree: {
        type: String,
        required: true,
    },
    bannerImage: {
        type: String,  // Assuming bannerImage is a String representing the image filename
        required: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
});

module.exports = mongoose.model('Banner',bannerSchema)