const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required:true
    },
    orderId:{
        type: String,
        unique: true, // Ensure orderId is unique
        required: true
    },
    products:[
      {
        product : {
          type: mongoose.Schema.Types.ObjectId,
         ref: 'Products',
         required:true
        },
        product_name:{
          type:String,
          required:true
      } ,
      product_price:{
        type:Number,
        require:true
      },
        product_total:{
           type:Number,
           required:true
           },
        quantity:{
          type: Number,
          required:true
        }
      }
    ],
    shippingAddress: {
      address: {
          type: String,
          required: true
      },
      town: {
          type: String,
          required: true
      },
      country: {
          type: String,
          required: true
      },
      state: {
          type: String,
          required: true
      },
      postalCode: {
          type: String,
          required: true
      },
      email: {
          type: String,
          required: true
      },
      phoneNumber: {
          type: String,
          required: true
      }
  },
    status: {
      type: String,
      enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
      default: 'Pending'
    },
    paymentMethod: {
      type: String,
      required: true
    },
    total_amount:{
        type:Number,
        required:true
    },
    reasonResponse:{
      type:String
    },
    delivered: {
      deliveredDate: Date
    },

  }, { timestamps: true });
  
module.exports = mongoose.model('Order', orderSchema);