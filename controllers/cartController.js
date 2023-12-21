const Cart = require("../model/cartModel");
const Category = require("../model/categoryModel");
const Products = require("../model/productModel");
const User = require("../model/userModel");
const Address = require("../model/addressModel")
const Coupon = require("../model/couponModel")
const CryptoJS = require('crypto-js');
 


// To get cart details

const getCart = async (req, res) => {
  try {
    
    const category = await Category.find();
    const products = await Products.find();
    const coupon = await Coupon.find()
    const listedCoupons = coupon.filter(coupon => coupon.isListed)
    const userId = req.session.user_id;
    const user = await User.findById({ _id: userId });
     
    const cart = await Cart.findOne({ user: userId }).populate(
      "products.product"
    );

    if (!cart) {
       const emptyCart = { products: [] };
      res.render("cart", {
        cart: emptyCart,
        user,
        category,
        products,
        calculateTotalPrice: 0,
        listedCoupons
      });
    } else {
  
      let calculateTotalPrice = 0;
      for (const cartProduct of cart.products) {
        const product = cartProduct.product;
        const cartQuantity = cartProduct.quantity;
        calculateTotalPrice += product.product_sales_price * cartQuantity;
      }

      
      res.render("cart", {user, cart, category, products, calculateTotalPrice,listedCoupons });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while processing the cart.");
  }
};

const addToCart = async (req, res) => {
  const userId = req.session.user_id;
  const { productId: product_id } = req.body;
  const quantity = req.body.quantity || 1;

  try {
    const product = await Products.findById(product_id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({ success: false, message: "Out of stock" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, products: [] });
    }

    const existingProduct = cart.products.find((item) =>
      item.product.equals(product_id)
    );

    if (existingProduct) {
      existingProduct.quantity += Number(quantity);
      existingProduct.product_total = existingProduct.quantity * product.product_sales_price;
      existingProduct.product_name = product.product_name; 
      existingProduct.product_price = product.product_sales_price
    } else {
      const productTotal = quantity * product.product_sales_price;
      cart.products.push({
        product: product_id,
        quantity,
        product_total: productTotal,
        product_name: product.product_name, 
        product_price: product.product_sales_price
      });
    }

    const cartSubtotal = cart.products.reduce((subtotal, item) => {
      return subtotal + item.product_total;
    }, 0);

    cart.cartSubtotal = cartSubtotal;
    cart.couponDiscount = 0
    await product.save();
    await cart.save();

    res.status(200).json({ success: true, message: "Item added to cart" });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while adding the product to the cart");
  }
};





const removeFromCart = async(req, res)=>{
  const{coupon}=req.body
  
  const userId = req.session.user_id;
  const productId = req.params.productId;
  try {
    let cart = await Cart.findOne({ user: userId});
    if(!cart){
      return res.status(404).json({success: false, message: 'Cart not found'})

    }

    const productIndex = cart.products.findIndex((item)=>
    item._id.equals(productId)
    );

    if(productIndex === -1){
      return res.status(404).json({ success: false, message: 'Product not found in the cart'});
    }
  
    cart.products.splice(productIndex, 1);
    const cartSubtotal = cart.products.reduce((subtotal, item) => {
      return subtotal + item.product_total;
    }, 0);


    cart.cartSubtotal = cartSubtotal;

    const discountcpn = await Coupon.findOne({couponCode:coupon})
if(discountcpn){
  if(cart.cartSubtotal >= discountcpn.minAmount){
    cart.couponDiscount = (cart.cartSubtotal*discountcpn.discount)/100
   if( cart.couponDiscount >= discountcpn.maxDiscount){
    cart.couponDiscount = discountcpn.maxDiscount
  }
  }else{
    cart.couponDiscount = 0;
  }
} else {
  cart.couponDiscount = 0;
}
    await cart.save();
    res.status(200).json({success: true,cartSubtotal,cart});
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: 'An error occurred while removing the product from the cart' });
  }
}


const  updateQuantity = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.body.productId;
    const operation = req.params.operation; 
    const couponId = req.body.couponId
    const cart = await Cart.findOne({ user: userId }).populate(
      "products.product"
      );
      
      const product = cart.products.find((item) =>
      item._id.equals(productId)
      );
      
      
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      const id = product.product

    const selectedproduct = await Products.findById(id)  
   const Discountcoupon = await Coupon.findOne({couponCode:couponId})

    if (operation === 'increment') {
      if (product.quantity >= selectedproduct.quantity) {
        return res.json({ success: false, message: 'Out of stock' });
      }else{
        product.quantity += 1;
      }
    } else if (operation === 'decrement') {
   
      product.quantity = Math.max(product.quantity - 1, 1);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid operation' });
    }
    
    product.product_total = product.quantity * product.product.product_sales_price;
    cart.cartSubtotal = cart.products.reduce((subtotal, product) => {
      return subtotal + product.product_total;
    }, 0);
    
    if(Discountcoupon){
      if(cart.cartSubtotal >= Discountcoupon.minAmount){
        cart.couponDiscount = (cart.cartSubtotal*Discountcoupon.discount)/100
       if( cart.couponDiscount >= Discountcoupon.maxDiscount){
        cart.couponDiscount = Discountcoupon.maxDiscount
      }
      }else{
        cart.couponDiscount = 0;
      }
    } else {
      cart.couponDiscount = 0;
    }
    await cart.save();

    res.json({ success: true, message: `Quantity ${operation}ed successfully`, updatedQuantity: product.quantity,cart });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }

}



const loadCheckout= async (req,res)=>{
  try {

    const { coupon } = req.query;

    if(coupon){
      var decryptedCoupon = CryptoJS.AES.decrypt(coupon, 'secretKey').toString(CryptoJS.enc.Utf8);
    }


    const userAddress = await Address.find({ user: req.session.user_id });
    const userId = req.session.user_id;
    const user = await User.findById({ _id: userId })
    const cart = await Cart.findOne({ user: userId }).populate('products.product');
    if(!decryptedCoupon){
      cart.couponDiscount = 0
      await cart.save()
    }
   


    if (cart && cart.products && cart.products.length > 0) {
      
     res.render('checkout', { user, cart ,userAddress,coupon });

    } else {
      cart.cartSubtotal = 0
      cart.couponDiscount = 0
      await cart.save()
      res.render('checkout', { user, cart, totalSubtotal:0,userAddress,coupon:0 })
    }
  } catch (error) {
    console.log(error.message);    
    res.status(500).redirect("/404")
  }
}


const check_quantity = async(req,res)=>{
  try {
    const userId = req.session.user_id
    const cart = await Cart.findOne({ user: userId }).populate('products.product');
    const couponId = req.body.couponId
    if(couponId){
      let coupon = await Coupon.findOne({couponCode:couponId});
      if(!coupon.isListed){
        cart.couponDiscount = 0
        cart.save()
        return res.json({success : false , message: "coupon is not available please cancel the coupon" ,cart})
      }
    }

    for (const cartProduct of cart.products) {
      const productInDb = cartProduct.product;
      const cartQuantity = cartProduct.quantity;

      if (productInDb.quantity < cartQuantity) {
       cartProduct.quantity = productInDb.quantity;
       await cart.save();
        return res.status(200).json({
          success: false,
          message: `Product ${productInDb.product_name} is out of stock`,
        });
      }
    }
    res.status(200).json({
      success: true,
      message: "All products are in stock",
    });

  } catch (error) {
    console.log(error.message);    
    res.status(500).redirect("/404")
  }
}


module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  loadCheckout,
  updateQuantity,
  check_quantity
};
