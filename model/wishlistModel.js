const mongoose=require("mongoose")

const wishListSchema=new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Replace with the actual User model name
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Products', // Replace with the actual Product model name
    },
  ],
})


module.exports=new mongoose.model("Wishlist",wishListSchema)