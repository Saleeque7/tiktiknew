const express = require("express");
const user_route = express();
const auth = require("../middleware/userAuth");
const userController = require("../controllers/userController");
const cartController = require("../controllers/cartController");
const addressController = require("../controllers/addressController");
const orderController = require("../controllers/orderController");
const uploadProduct = require("../multer/userMulter");
const wishListController = require("../controllers/wishListController");
const productController = require("../controllers/productController");
const couponController = require("../controllers/couponController");
const bannerController  = require ("../controllers/bannerController")


user_route.set("views", "./views/users");

//register route
// user_route.get("",auth.isLogout,userController.loadRegister);
user_route.get("/register", auth.isLogout, userController.loadRegister);
user_route.post(
  "/register",
  uploadProduct.single("image"),
  userController.insertUser
);

//otp verificationroute
user_route.get("/otp", userController.otppage);
user_route.post("/VerifyOtp", userController.VerifyOtp);

user_route.get("/login", auth.isLogout, userController.loginPage);
user_route.post("/login", userController.verifyLogin);

//forgetPassword
user_route.get("/forget", userController.forgetLoad);
user_route.post("/forget", userController.forgetVerify);

//forgetPasswordotp verify
user_route.get("/forgetOtp", userController.verifyOtpLoad);
user_route.post("/forgetVerify", userController.verifyResetOtp);
user_route.post("/resendForgot", userController.resendForget);

//forgetPassword resetPassword
user_route.get("/resetPassword", userController.resetPassword);
user_route.post("/resetPassword", userController.resetNewPassword);

user_route.get("/logout", auth.isLogin, userController.userLogout);

user_route.get("/", auth.isLogout, userController.loadHome);
user_route.get("/home", auth.isLogin, userController.loadHome);

user_route.get("/watches", userController.loadWatches);

user_route.get("/band", userController.loadBand);

user_route.get("/404", userController.errorPage);

user_route.post("/resendOTP", userController.resendOtp);

//cart
user_route.get("/cart", auth.isLogin, auth.isBlock, cartController.getCart);
user_route.post("/add-item-to-cart", auth.isLogin, cartController.addToCart);
user_route.delete(
  "/removeFromCart/:productId",
  auth.isLogin,
  cartController.removeFromCart
);
user_route.get(
  "/checkout",
  auth.isLogin,
  auth.isBlock,
  cartController.loadCheckout
);
user_route.post(
  "/update-quantity/:operation",
  auth.isLogin,
  cartController.updateQuantity
);

//wishlist
user_route.get("/wishList", auth.isLogin, wishListController.loadWishList);
user_route.post(
  "/addToWishlist",
  auth.isLogin,
  wishListController.addToWishlist
);
user_route.delete(
  "/removeFromWishlist/:productId",
  auth.isLogin,
  wishListController.removeWishlist
);

user_route.get("/productDetails", auth.isLogin, userController.productDetails);
user_route.get("/userProfile", auth.isLogin, userController.userProfile);
user_route.get("/editProfile", auth.isLogin, userController.editProfile);
user_route.post(
  "/editProfile",
  auth.isLogin,
  uploadProduct.single("image"),
  userController.editedProfile
);

//address
user_route.get("/loadAddress", auth.isLogin, addressController.loadAddress);
user_route.get(
  "/getaddressLIst",
  auth.isLogin,
  addressController.getAddressList
);
user_route.post("/loadAddress", auth.isLogin, addressController.insertAddress);
user_route.post(
  "/setDefaultAddress",
  auth.isLogin,
  addressController.setDefault
);
user_route.get("/edit", auth.isLogin, addressController.editAddress);
user_route.post(
  "/editloadAddress",
  auth.isLogin,
  addressController.changedAddress
);
user_route.post(
  "/checkoutAddress",
  auth.isLogin,
  addressController.setDefaultCheckout
);
user_route.post(
  "/saveAddress",
  auth.isLogin,
  addressController.savechktAddress
);

//place order
user_route.post("/makeorder", auth.isLogin, orderController.makeOrder);
user_route.get("/orderComplete", auth.isLogin, orderController.orderComplete);
user_route.get("/listOrder", auth.isLogin, orderController.listOrder);
user_route.post(
  "/makeOnlineOrder",
  auth.isLogin,
  orderController.makeOnlineOrder
);
user_route.post(
  "/makewalletOrder",
  auth.isLogin,
  orderController.makewalletOrder
);
user_route.post('/walletAddMoney',auth.isLogin , orderController.walletAddMoney)
user_route.post('/verifywalletAddMoney',auth.isLogin , orderController.verifywalletAddMoney)

user_route.get('/showWalletHistory' , auth.isLogin , orderController.showWalletHistory)
user_route.post("/verifyPayment", auth.isLogin, orderController.verifyPayment);
user_route.post("/ordercancel", auth.isLogin, orderController.cancelOrder);
user_route.post("/orderReturn", auth.isLogin, orderController.orderReturn);

user_route.post("/search", userController.searchProd);

user_route.post("/userapplycoupon", auth.isLogin, couponController.applyCoupon);

user_route.get('/banner',bannerController.loadbanner)

user_route.get('/invoice', auth.isLogin, orderController.getOrderInvoice)
user_route.post('/check-quantity',auth.isLogin,cartController.check_quantity)
module.exports = user_route;
