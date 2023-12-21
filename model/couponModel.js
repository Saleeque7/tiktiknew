const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  couponCode: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  couponDisplay: {
    type: String,
  },
  discount: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  maxDiscount: {
    type: Number,
    min: 0,
  },
  minAmount: {
    type: Number,
    min: 0,
  },
  creationDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  expirationDate: {
    type: Date,
    required: true,
  },
  isListed: {
    type: Boolean,
    default: false
  }
});
module.exports = mongoose.model('Coupon', couponSchema,)