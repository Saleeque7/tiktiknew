const User = require("../model/userModel")

const isLogin = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      next();
    } else {
     return res.redirect('/'); // Redirect the user to the login page if not logged in
    }
  } catch (error) {
    console.log(error.message);
  }
};


const isLogout = async(req,res,next)=>{
  try{
if(req.session.user_id){
return res.redirect('/home')
}
next();
  }catch(error){
  console.log(error.message);
  }
}

const isBlock = async (req, res, next) => {
  try { 
    const user = await User.findById({ _id: req.session.user_id })
    console.log(user,"no user");

    if (user.is_block === true ) {   
       delete req.session.user_id
       res.redirect('/login');
      
    } else {
      console.log("...................................");
      next();
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('404',{message:'Internal server error'});
  }
}

module.exports= {
  isLogin,
  isLogout,
  isBlock 

}