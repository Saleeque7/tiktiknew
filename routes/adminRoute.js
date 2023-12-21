const express = require("express");
const admin_route = express();
const uploadProduct = require("../multer/productMulter");
const auth = require("../middleware/adminAuth");
const adminController = require("../controllers/adminController");
const categoryController = require("../controllers/categoryController");
const productController = require("../controllers/productController");
const orderController = require("../controllers/orderController");
const couponController = require("../controllers/couponController");
const userController = require("../controllers/userController");
const salesReportController = require("../controllers/salesReportController")
const bannerController  = require ("../controllers/bannerController")
const uploadProductOne = require("../multer/userMulter");

admin_route.set("views", "./views/admin");

//adminLogin
admin_route.get("/", auth.isLogout, adminController.adminLogin);
admin_route.post("/", adminController.verifyLogin);

// adminController.verifyLogin

admin_route.get("/home", auth.isLogin, adminController.loadDashboard);

//logout
admin_route.get("/logout", auth.isLogin, adminController.logout);

//productpage
admin_route.get("/product", auth.isLogin, adminController.loadProduct);

// userManageement
admin_route.get("/users", auth.isLogin, adminController.getUsers);
// admin_route.get("/users", auth.isLogin, adminController.adminDashboard);

admin_route.get("/block", auth.isLogin, adminController.blockUser);
admin_route.get("/unblock", auth.isLogin, adminController.unblockuser);

// category get and post
admin_route.get("/category", auth.isLogin, categoryController.getCategory);
admin_route.post("/category", auth.isLogin, categoryController.addCategory);
admin_route.get("/edit_category", auth.isLogin, categoryController.edit_category);
admin_route.post("/edited_category", auth.isLogin, categoryController.edited_category);
admin_route.get(
  "/categories/delete-category",
  auth.isLogin,
  categoryController.deleteCategory
);
admin_route.get("/List-category", auth.isLogin, categoryController.List_category);
admin_route.get("/unList-category", auth.isLogin, categoryController.unList_category);

admin_route.get("/404", userController.errorPage);
// product management

admin_route.get("/products", auth.isLogin, productController.getProduct);
admin_route.post(
  "/products",
  uploadProduct.array("images", 4),
  productController.addProduct
);
admin_route.get("/productlist", auth.isLogin, productController.listProduct);
admin_route.get("/editProduct", auth.isLogin, productController.editLoad);
admin_route.post(
  "/editProduct",
  auth.isLogin,
  uploadProduct.array("images", 4),
  productController.editProduct
);
admin_route.get(
  "/deleteProduct",
  auth.isLogin,
  productController.deleteProduct
);

//load brand
admin_route.get("/brand", auth.isLogin, productController.loadBrand);
admin_route.get("/edit_brand", auth.isLogin, productController.edit_brand);
admin_route.get("/List_brand", auth.isLogin, productController.List_brand);
admin_route.get("/unList_brand", auth.isLogin, productController.unList_brand);
admin_route.post("/edited_brand", auth.isLogin, productController.edited_brand);
admin_route.post("/brand", auth.isLogin, productController.addBrand);
admin_route.get(
  "/brand/delete-brand",
  auth.isLogin,
  productController.deleteBrand
);

//loadorderList

admin_route.get("/orderList", auth.isLogin, orderController.orderHistory);
admin_route.get(
  "/order/:orderId",
  auth.isLogin,
  orderController.orderDetailPage
);

admin_route.get('/salesReport',auth.isLogin,salesReportController.salesReport)
admin_route.get('/reports/sales/download/:type', auth.isLogin, salesReportController.adminDownloadReports);

admin_route.post(
  "/status/:orderId/",
  auth.isLogin,
  orderController.updateStatus
);
admin_route.post(
  "/deletedproduct",
  auth.isLogin,
  productController.deteEditeproduct
);

//coupon management 
admin_route.get("/coupon", auth.isLogin, couponController.loadAddCoupon);
admin_route.post("/addCoupon", auth.isLogin, couponController.addCoupon);
admin_route.get("/listcoupons", auth.isLogin, couponController.couponList);
admin_route.get("/edit-coupon/:id", auth.isLogin, couponController.editCoupon);
admin_route.post(
  "/editcoupon/:id",
  auth.isLogin,
  couponController.editedCoupon
);
admin_route.post("/listedtCoupon", auth.isLogin, couponController.listCoupon);
admin_route.post("/unListCoupon", auth.isLogin, couponController.unListCoupon);



//banner
admin_route.get('/addbanner',auth.isLogin,bannerController.addBanner)
admin_route.post('/add-banner',uploadProductOne.single("image"),auth.isLogin,bannerController.add_banner)
admin_route.get('/banner_list',auth.isLogin,bannerController.banner_list)
admin_route.get('/edit_banner',auth.isLogin,bannerController.edit_banner)
admin_route.post('/edit_banner',uploadProductOne.single("image"),auth.isLogin,bannerController.edited_banner)
admin_route.get("/delete-banner/:id",auth.isLogin,bannerController.delete_banner)

module.exports = admin_route;
