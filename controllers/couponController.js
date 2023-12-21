const Coupon = require("../model/couponModel");
const Cart = require("../model/cartModel")

const loadAddCoupon = async (req, res) => {
  try {
    res.render("newCoupon");
  } catch (error) {
    console.log(error.message);
    res.redirect("/admin/404");
  }
};

const addCoupon = async (req, res) => {
  try {
    const {
      couponCode,
      description,
      discount,
      maxDiscount,
      minAmount,
      expirationDate,
    } = req.body;

    const newCoupon = new Coupon({
      couponCode,
      description,
      discount,
      maxDiscount,
      minAmount,
      expirationDate,
      isListed: true,
    });
    await newCoupon.save();

    res.json({ message: "Coupon added successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const couponList = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.render("listCoupon", { coupons });
  } catch (error) {
    res.redirect("/admin/404");
  }
};

const editCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const coupon = await Coupon.findById(couponId);
    res.render("editCoupon", { coupon });
  } catch (error) {
    console.log(error.message);
    res.redirect("/admin/404");
  }
};

const editedCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const updates = req.body;

    const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, updates);

    if (updatedCoupon) {
      return res.json({ success: true });
    } else {
      return res.status(400).json("error", { message: "Coupon not found" });
    }
  } catch (error) {
    console.error(err);
    return res.status(500).json({ error: "internal server error" });
  }
};

const listCoupon = async (req, res) => {
  try {
    const couponId = req.body.couponId;
    const coupons = await Coupon.findByIdAndUpdate(couponId, {
      isListed: true,
    });

    res.redirect("/admin/listcoupons");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const unListCoupon = async (req, res) => {
  try {
    const couponId = req.body.couponId;
    const coupons = await Coupon.findByIdAndUpdate(couponId, {
      isListed: false,
    });

    res.redirect("/admin/listcoupons");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;

    const userId = req.session.user_id;
    const cart = await Cart.findOne({ user: userId });

    const coupon = await Coupon.findOne({ couponCode: couponCode });

    if (!coupon) {
      cart.couponDiscount = 0
      return res.json({ success: false, message: "Invalid coupon code",cart });
    }

    if (coupon.expirationDate < Date.now()) {
      return res.json({ success: false, message: "Coupon is expired" });
    }

    if (cart.cartSubtotal >= coupon.minAmount) {
      const discount = coupon.discount;
      let discountAmt = (cart.cartSubtotal * discount) / 100;

      if (discountAmt >= coupon.maxDiscount) {
        discountAmt = coupon.maxDiscount;
      }

      cart.couponDiscount = discountAmt;
      await cart.save();
  
      return res.json({
        success: true,
        discountAmt,
        cart,
        message: "Coupon added successfully",
      });
    } else {
      return res.json({
        success: false,
        message: `Coupon available only for purchases up to ${coupon.minAmount} rupees`,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  applyCoupon,
  loadAddCoupon,
  addCoupon,
  couponList,
  editCoupon,
  editedCoupon,
  listCoupon,
  unListCoupon,
};
