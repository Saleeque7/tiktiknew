const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema({
  categoryname:{
    type:String,
    required:true
  },
  offer:{
    type:Number,
    require:true
  },
  isListed:{
    type:Boolean,
    default: true 
  }
},{ timestamps: true })

module.exports = mongoose.model("Categories",categorySchema);