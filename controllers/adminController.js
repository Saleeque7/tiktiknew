const User = require("../model/userModel");
const Order = require("../model/orderModel");
const Category = require("../model/categoryModel")
const Product = require("../model/productModel");
const session = require("express-session");
const bcrypt = require("bcrypt");
const categories = require("../model/categoryModel");
const helper = require("../helper/userHelper");


const adminLogin = async (req, res) => {
  try {
    console.log("hii");
    res.set("cache-Control", "no-store");
    res.render("adminLogin");
  } catch (error) {
    console.log(error.message);
  }
};


const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.is_admin === 0) {
          res.render("adminLogin", { message: "Admin not Found" });
        } else {
          req.session.admin_id = userData._id;
          res.redirect("/admin/home");
        }
      } else {
        res.render("adminLogin", { message: "Password is incorrect" });
      }
    } else {
      res.render("adminLogin", { message: "Admin not found" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadDashboard = async (req, res) => {
  try {
    const [ordersData] = await helper.calculateDeliveredOrderTotal()
    const orders = ordersData.total
    const categorySales = await helper.calculateCategorySales()
    const salesData = await helper.calculateDailySales()
    const salesCount = await helper.calculateOrderCountByDate()
    const categoryCount = await helper.calculateListedCategoryCount()
    const productsCount = await helper.calculateProductsCount()
    const onlinePay = await helper.calculateOnlineOrderCountAndTotal()
    const codPay = await helper.calculateCodOrderCountAndTotal()
    const walletPay = await helper.calculateWalletOrderCountAndTotal()
    const latestorders = await helper.getLatestOrders()
    const userData = await User.findById({ _id: req.session.admin_id });
    const results = await Order.aggregate([
      {
        $match: {
          status: { $in: ["Delivered", "Pending"] },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const [product] = await Product.aggregate([
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ]);
    const [category] = await Category.aggregate([
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ]);
    const deliveredCount =
      results.find((result) => result._id === "Delivered")?.count || 0;
    const pendingCount =
      results.find((result) => result._id === "Pending")?.count || 0;
    const totalCount = deliveredCount + pendingCount;


    res.set("cache-Control", "no-store");
    res.render("home", { admin: userData, totalCount, product,category, orders, productsCount, categoryCount,
        onlinePay: onlinePay[0],walletPay:walletPay[0], salesData, order: latestorders, salesCount,
        codPay: codPay[0], categorySales });
  } catch (error) {
    console.log(error.message);
  }
};

const loadProduct = async (req, res) => {
  try {
    const findCategory = await categories.find({});

    res.render("product", { findCategory });
  } catch (error) {
    console.log(error.message);
  }
};


const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 3;

    const totalUsers = await User.countDocuments();

    const totalPages = Math.ceil(totalUsers / pageSize);
    const skip = (page - 1) * pageSize;
    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);
    res.render("user", { users, currentPage: page, totalPages });
  } catch (error) {
    console.log(error.message);
  }
};


const blockUser = async (req, res) => {
  try {
    const userId = req.query.id;
    const userUpdate = await User.updateOne(
      { _id: userId },
      { $set: { is_block: true } }
    );
    res.redirect("/admin/users");
    if (userUpdate) {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const unblockuser = async (req, res) => {
  try {
    const userId = req.query.id;
    await User.updateOne({ _id: userId }, { $set: { is_block: false } });
    res.redirect("/admin/users");
  } catch (error) {
    console.log(error.message);
  }
};

const editUserLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      res.render("editProduct", { user: userData });
    } else {
      res.redirect("/admin/productList");
    }
  } catch (error) {
    console.log(error.message);
  }
};

//admin logout
const logout = async (req, res) => {
  try {
    delete req.session.admin_id;
    res.redirect("/admin/");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  adminLogin,
  verifyLogin,
  loadDashboard,
  logout,
  loadProduct,
  getUsers,
  blockUser,
  unblockuser,
  editUserLoad,
};
