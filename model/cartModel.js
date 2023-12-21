const mongoose = require('mongoose');

const cartSchema  = new mongoose.Schema({
    user: {
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [
        {
            product: {
                type:mongoose.Schema.Types.ObjectId,
                ref: 'Products',
            },
            product_name:{
                type:String,
                required:true
            } ,
            product_price:{
                type:Number,
                require:true
              },
            quantity: {
                type: Number,
                default: 1,
                min: 1,
            },

            product_total:{
                type:Number,
                required:true
            }
        }
    ],
    cartSubtotal:{
        type:Number,
        required:true
    },
    couponDiscount:{
        type:Number
    },
    DiscountAmt:{
        type:Number
    }
  
},{ timestamps: true })

module.exports = mongoose.model('Cart', cartSchema);