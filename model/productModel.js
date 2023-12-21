const mongoose = require("mongoose")

const productSchema = new mongoose.Schema({
  product_name:{
    type:String,
    require:true
  },
  product_price:{
    type:Number,
    require:true
  },
  product_offer:{
    type:Number,
    require:true
  },
  offer:{
    type:Number,
    require:true
  },
  product_sales_price:{
    type:Number,
    require:true
  },
  quantity:{
    type:Number,
    require:true
  },
  brandName:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"brands",
    require:true
  },
  image:{
    type:Array,
    require:true
  },
  categoryname:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Categories",
    require:true
    },

}, { timestamps: true });

module.exports = new mongoose.model("Products",productSchema);