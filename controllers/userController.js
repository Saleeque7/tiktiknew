const User = require("../model/userModel");
const helper = require("../helper/userHelper");
const session = require("express-session");
const product = require("../model/productModel");
const randomString = require("randomstring");
const bcrypt = require("bcrypt");
const Category = require("../model/categoryModel");
const brand = require("../model/brandModel");
const Address = require("../model/addressModel");
const Banner  = require ("../model/bannerModel")



const loadRegister = async (req, res) => {
  try {
    res.render("registration");
  } catch (error) {
    console.log(error.message);
    res.status(404).redirect('404')
  }
};

const insertUser = async (req, res) => {
  try {
   
    const {name ,email , mobile, password,referralCode } = req.body
    console.log(referralCode,"referralCode");
    const securepassword = await helper.securePassword(password);
    const existEmail = await User.findOne({ email: email });

    if (existEmail) {   
     return res.json({success:false,message:"email already exist"})
    }

    const userDb = await User.find()
  
    const user = new User({
      name: name,
      email: email,
      mobile: mobile,
      password: securepassword,
      image:req.file.filename,
      is_verified: 0,
    });

    if(referralCode !== null && referralCode !== 'null'){
      const matchingUser = userDb.find(user => user.referralCode === referralCode);
      console.log(matchingUser,"matchingUser");
      if (matchingUser) {
        matchingUser.is_bonusEligible = true;
        matchingUser.save()
      }else{
        return res.json({success:false,message:"Invalid ReferralCode",isBonusEligible: false})
      }
    }

    if (user) {
      const otp = randomString.generate({ length: 4, charset: "numeric" });
      console.log(otp);

      req.session.tempOtp = otp;
      req.session.tempUser = user;

      await helper.sendVerifyMail(name, email, otp);
  
      res.json({success:true,user})
    } else {
      res.render("registration", {
        message: "your registration has been Failed",
      });
    }
  } catch (error) {
    res.redirect('/404')
  }
};


const otppage = async (req, res) => {
  try {
    res.render("otp", {
      userId: req.query.id,
      message: "OTP has been sent to your email.",
    });
  } catch (error) {
    console.log(error.message);
  }
};

const VerifyOtp = async (req, res) => {
  try {
    const enteredOTP = req.body.otp;
    const userId = req.body.userId;
    const tempUser = req.session.tempUser;
 
    if (!tempUser) {
      return res.json({
        success:false,
        message: "User data not found. Please try again.",
        userId: userId,
      });
    }
    

    const actualOTP = req.session.tempOtp;
    if (actualOTP === enteredOTP) {

      const randomNumber = Math.floor(100000 + Math.random() * 900000)
      tempUser.referralCode =  'REF'+randomNumber
      const userData = new User(tempUser);
      await userData.save();
      const updateInfo = await User.updateOne(
        { _id: userId },
        { $set: { is_verified: 1 } }
      );
      const userInfo = await User.find()

      const matchingUser = await  userInfo.find(user => user.is_bonusEligible === true);
      if(matchingUser){
        const GrandTotal = 500
        const transactionType = 'credit'
        const orderType = 'Refferal Bonus'
        await helper.updateWalletBalance(matchingUser._id, GrandTotal, transactionType ,orderType);
        await helper.updateWalletBalance(userId, GrandTotal, transactionType ,orderType);
        matchingUser.is_bonusEligible = false
        matchingUser.save()
      }

      res.status(200).json({ success: true });
    } else {
       res.status(400).json({ success: false,message:"OTP is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(404).redirect('/404');
  }
};

const loginPage = async (req, res) => {
  try {
    res.set("cache-Control", "no-store");
    res.render("login");
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
      if (userData.is_block) {
        res.render("login", { message: "Your account is blocked." });
        return; 
      }

      const passwordmatch = await bcrypt.compare(password, userData.password);

      if (passwordmatch) {
        if (userData.is_verified === 0) {
          res.render("login", { message: "please verify your mail" });
        } else {
          req.session.user_id = userData._id;
          res.redirect("/home");
        }
      } else {
        res.render("login", { message: " password is incorrect" });
      }
    } else {
      res.render("login", { message: "User Not Found" });
    }
  } catch (error) {
    res.redirect('/404')
  }
};

const errorPage = async (req, res) => {
  try {
    res.render('404')
  } catch (error) {
    console.log(error);
  }
}
const loadBand = async (req, res) => {
  try {
    const userData = await User.findById(req.session.user_id);
    const products = await product.find();
    res.render("band", { products, user: userData });
  } catch (error) {
    console.log(error.message);
  }
};


const searchProd = async (req, res) => {
  try {
    const user = await User.findById(req.session.user_id);
    const search = req.body.search;
    const page = parseInt(req.body.page) || 1;
    const pageSize = 6;
    const productCategory = req.body.productCategory;
    const productBrand = req.body.productBrand
    const productRange = req.body.productRange;
    const filter = {}
    let rangefilter = []
    if(search){
      const regex = new RegExp('^' + search, 'i');
      filter.product_name = regex
    }
    if (productCategory) {
      filter.categoryname = { $in: productCategory }
    }
    if (productBrand){
      filter.brandName = { $in: productBrand }
    }
    if(productRange) {
      for (let i = 0; i < productRange.length; i++) {
        if(productRange[i] == 'lt2000') {
          rangefilter.push({ product_sales_price: { $lte: 2000 } })
        }
        if(productRange[i] == 'lt4000') {
          rangefilter.push({ product_sales_price: { $gt: 2000, $lte: 4000 } })
        }
        if(productRange[i] == 'lt8000') {
            rangefilter.push({ product_sales_price: { $gt: 4000, $lte: 8000 } })
        }
        if(productRange[i] == 'lt15000') {
            rangefilter.push({ product_sales_price: { $gt: 8000, $lte: 15000 } })
        }
        if(productRange[i] == 'gt15000') {
            rangefilter.push({ product_sales_price: { $gt: 15000} })
        }
      }
      filter.$or = rangefilter
    }

    
    const products = await product.find(filter);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedProducts = products.slice(startIndex, endIndex);
    const totalPages = Math.ceil(products.length / pageSize);

    if (products.length) {
      res.json({
        user,
        products: paginatedProducts, currentPage: page,
        totalPages
      })
    } else {
      res.json({ noProducts: true })
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};




const loadWatches = async (req, res, searchProduct) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const categoryname = req.query.categoryname || 'all';
    const brandId = req.body.brandId;

    const pageSize = 6;

    let totalProducts;
    let products;

    if (categoryname !== 'all') {

      const selectedCategory = await Category.findOne({ categoryname });
      totalProducts = await product.countDocuments({ categoryname: selectedCategory._id });
      products = await product.find({ categoryname: selectedCategory._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize);
      console.log('seele', products)
    } else {
      totalProducts = await product.countDocuments();
      products = await product.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize);
    }

    const totalPages = Math.ceil(totalProducts / pageSize);
    const user = await User.findById(req.session.user_id);
    const categories = await Category.find();
    const brands = await brand.find();
    res.render("watches", {
      products,
      user,
      categories,
      brands,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};


const userLogout = (req, res) => {
  try {
    delete req.session.user_id
    res.redirect("/home");
  } catch (error) {
    console.log(error.message);
  }
};


const loadHome = async (req, res) => {
  try {
    res.set("cache-Control", "no-store");
    const products = await product.find();
    const banner = await Banner.find()
    if (!req.session.user_id) {
      res.render("home", { products,banner });
      return;
    }
    const userData = await User.findById(req.session.user_id);
    res.set("cache-Control", "no-store");
    res.render("home", { user: userData, products,banner });
  } catch (error) {
    console.log(error.message);
  }
};


const forgetLoad = async (req, res) => {
  try {
    res.render("forget");
  } catch (error) {
    console.log(error.message);
  }
};

const forgetVerify = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      if (userData.is_Verified === 0) {
        res.render("forget", { message: "please verify your mail.." });
      } else {
        const otp = randomString.generate({ length: 4, charset: "numeric" });
        console.log(otp);
        delete req.session.tempOtp
        req.session.tempOtp = otp;
        await helper.sendResetPasswordMail(userData.name, userData.email, otp);
        res.render('forgetOtp',{userId:userData.id});
      }
    } else {
      res.render("forget", { message: "user not found" });
    }
  } catch (error) {
    console.log(error.message);
    res.redirect("/404")
  }
};

const verifyOtpLoad = async (req, res) => {
  try {
    res.render("forgetOtp", { userId: req.query.id });
  } catch (error) {
    console.log(error.message);
  }
};

const verifyResetOtp = async (req, res) => {
  try {

    const enteredOTP = req.body.otp
    const saveOtp = req.session.tempOtp;
    if (saveOtp === enteredOTP) {
      const id = req.body.userId.trim();
      res.status(200).json({ success:true, message:"verification successfull",userId:id });
    } else {
     
      res.status(400).json({success:false,message:"OTP incorrect"})
    }
  } catch (error) {
    console.log(error.message);
  }
};

const resetPassword = async(req,res)=>{
  try{
    const userId = req.query.id
   
    res.render('forgetPassword',{userId:userId})
  }catch(error){
    console.log(error);
  }
}

const resetNewPassword = async (req, res) => {
  try {
    const {Password , userId} = req.body
    if(!userId){
      res.json({success:false,message:"userdata not found"})
    }
  
    const secure_password = await helper.securePassword(Password);
    const updateData = await User.findByIdAndUpdate(
      { _id: userId },
      { $set: { password: secure_password } }
    );
    res.json({success:true,message:"Password Reset is Successfull..."});
  } catch (error) {
    console.log(error.message);
  }
};

const loadOrder = async (req, res) => {
  try {
    res.render("orderComplete");
  } catch (error) {
    console.log(error.message);
  }
};



const productDetails = async (req, res) => {
  try {
    const productId = req.query.id;

    const products = await product
      .findById(productId)
      .populate("categoryname")
      .populate("brandName");
    const user = req.session.user_id;

    res.render("productDetails", { user, products });
  } catch (error) {
    console.log(error.message);
    res.redirect('/404')
  }
};

const userProfile = async (req, res) => {
  try {
    const userData = await User.findById(req.session.user_id);
    const userAddress = await Address.find({
      user: req.session.user_id,
    }).populate("addresses");

    res.render("userProfile", { user: userData, userAddress });
  } catch (error) {
    console.log(error.message);
  }
};

const editProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.user_id)
    const userAddress = await Address.find({
      user: req.session.user_id,
    }).populate("addresses");

    res.render('editProfile', { user, userAddress })
  } catch (error) {
    res.status(404).render('404', { message: "something went wrong" })
    console.log(error.message);
  }
}


const editedProfile = async (req, res) => {
  try {
    const { fullName, mobile, email } = req.body;
    const user = await User.findById(req.session.user_id)
    user.name = fullName
    user.mobile = mobile
    user.email = email
    if (req.file) {
      user.image = req.file.filename;
    }
    await user.save()
    res.redirect('/userProfile')

  } catch (error) {
    res.status(500).redirect("/404");
    console.log(error.message);
  }
};

const resendOtp = async (req, res) => {
  try {
      const tempUser = req.session.tempUser;
      const newOTP = randomString.generate({ length: 4, charset: "numeric" });
      await helper.sendVerifyMail(tempUser.name, tempUser.email, newOTP);
      delete req.session.tempOtp;
      req.session.tempOtp = newOTP;
      res.json({ success: true });
  } catch (error) {
      console.log(error.message);
      res.status(404).redirect('/404');
  }
};




const resendForget = async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await User.findOne({id:userId})
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    const newOTP = randomString.generate({ length: 4, charset: "numeric" });
    console.log(newOTP ,"newotp")
    await helper.sendVerifyMail(user.name, user.email, newOTP);
    delete req.session.tempOtp
    req.session.tempOtp = newOTP
    return res.json({ success: true, message: "OTP Resent"});
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: "Error resending OTP" });
  }
};

;



module.exports = {
  loadRegister,
  insertUser,
  otppage,
  VerifyOtp,
  loginPage,
  verifyLogin,
  loadHome,
  userLogout,
  loadWatches,
  loadBand,
  forgetLoad,
  forgetVerify,
  verifyResetOtp,
  verifyOtpLoad,
  errorPage,
  resetPassword,
  resetNewPassword,
  loadOrder,
  resendOtp,
  productDetails,
  userProfile,
  editProfile,
  editedProfile,
  searchProd,
  resendForget

};
