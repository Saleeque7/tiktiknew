const mongoose = require("mongoose")

const brandSchema = new mongoose.Schema({
  brandName:{
    type:String,
    require:true
  },
  isListed:{
    type:Boolean,
    default:true
  }

},{ timestamps: true })

module.exports = mongoose.model("brands",brandSchema);