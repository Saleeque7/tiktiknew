const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    email:{
        type:String,
        require:true
    },
    mobile:{
        type:String,
        require:true
    },
    image:{
        type:String,
        required:true
    },
    password:{
        type:String,
        require:true
    },
    referralCode:{
        type:String,
        required:true,
        default: 0,
      },
    is_admin:{
        type:Number,
        required:true,
        default: 0,
    },
    is_verified:{
        type:Number,
        required:true,
        default:0
    },
    is_block:{
        type:Boolean,
        default:false
    },
    is_bonusEligible:{
        type:Boolean,
        default:false
    },
    active: {
        type: Boolean,
        default: true 
    },
   
},{ timestamps: true });



module.exports = new mongoose.model("users",userSchema);