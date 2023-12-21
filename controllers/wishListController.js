const Products = require("../model/productModel");
const Category = require("../model/categoryModel")
const cropImage = require("../multer/cropProductImg");
const User = require("../model/userModel");
const Wishlist = require('../model/wishlistModel')

const loadWishList =async (req,res)=>{
    try {
        
    const category = await Category.find();
    const products = await Products.find();
    const userId = req.session.user_id;
    const user = await User.findById({ _id: userId });
    
  
    const wishList = await Wishlist.findOne({ user: userId }).populate(
      "products"
    );

 

      res.render("wishlist", {user, wishList, category, products });
    
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while processing the wishlist.");
  }
}

const addToWishlist = async(req,res)=>{
    const userId = req.session.user_id;
    const { productId: product_id } = req.body;
        try {
          const product = await Products.findById(product_id);
          if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
          }
      
          const wishlist = await Wishlist.findOne({ user: userId });
      
          if (wishlist) {
         
            if (wishlist.products.includes(product_id)) {
             
              wishlist.products = wishlist.products.filter(item => !item.equals(product_id));
              await wishlist.save();
              res.status(200).json({ success: true, message: "Item removed from wishlist", wishlist });
            } else {
              wishlist.products.push(product_id);
              await wishlist.save();
              res.status(200).json({ success: true, message: "Item added to wishlist", wishlist });
            }
          } else {
            const newWishlist = new Wishlist({
              user: userId,
              products: [product_id],
            });
            await newWishlist.save();
            res.status(200).json({ success: true, message: "Item added to wishlist", wishlist: newWishlist });
          }
        } catch (error) {
          console.error(error);
          res.status(500).json({
            success: false,
            message: "An error occurred while updating the wishlist",
          });
        }
    }


  const removeWishlist = async (req,res)=>{
    const userId = req.session.user_id
    const productId = req.params.productId
    try {
      const wishlist = await Wishlist.findOne({user:userId})

      if(!wishlist){
        return res.status(404).json({success: false, message: 'wishlist not found'})
  
      }
  
      const productIndex = wishlist.products.findIndex((item) =>
      item.product && item.product.equals(productId)
    );
  
      if(productId === -1){
        return res.status(404).json({ success: false, message: 'Product not found in the wishlist'});
      }
    
      wishlist.products.splice(productIndex, 1);
   
      await wishlist.save();
      res.status(200).json({success: true});
    } catch (error) {
      console.log(error.message);
    }
  }

module.exports = {
    loadWishList,
    addToWishlist,
    removeWishlist
}