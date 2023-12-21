const admin = require("../model/userModel")

const isLogin = async (req, res, next) => {
  try {
    if (req.session.admin_id) {
      return next();
    } else {
      return res.redirect('/admin');
    }
  } catch (error) {
    console.log(error.message);
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.admin_id) {
      return res.redirect('/admin/home');
    }
    next();
  } catch (error) {
    console.log(error.message);
  }
};
// const isBlock = async (req, res, next) => {
//   try { 
//     const Admin = await admin.findById({ _id: req.session.admin_id })
//     // console.log(user,"no user");

//     if (Admin.is_block === true ) {   
//       // req.session.destroy();
//        res.redirect('/admin');
      
//     } else {
//       console.log("...................................");
//       next();
//     }
//   } catch (error) {
//     console.log(error.message);
//     res.status(500).render('404',{message:'Internal server error'});
//   }
// }

module.exports = {
  isLogin,
  isLogout,
  
};
