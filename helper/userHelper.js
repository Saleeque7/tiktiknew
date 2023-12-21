const User = require("../model/userModel");
const config = require("../config/config")
const bcrypt = require("bcrypt")
const nodeMailer = require("nodemailer")
const Wallet = require('../model/walletModel');
const Order = require("../model/orderModel");
const Category = require("../model/categoryModel")
const Product = require("../model/productModel");

//password hashing

  const securePassword =  async (password)=>{
    try {
        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash
    } catch (error) {
        console.log(error.message);
    }
  }




  //verifyMail//otpgenerate
  const sendVerifyMail = async(name, email,otp)=>{
    try{
       const transporter = nodeMailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:config.emailUser,
                pass:config.emailPassword
            }
            
        })
        const mailOptions = {
            from:config.emailUser,
            to:email,
            subject: 'for varification mail',
            html: '<p>Hyy '+name+" "+"this is your verify opt " +"  "+  otp+' "</p>'
        }

        transporter.sendMail(mailOptions, function(error,info){
            if(error){
                console.log(error);
            }else{
                console.log("Email has been sent:-",info.response);
            }
        })
        } catch(error){
            console.log(error.message);
    }
}

//reset passwordmail
const sendResetPasswordMail = async(name,email,otp)=>{
    try{
        const transporter = nodeMailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:config.emailUser,
                pass:config.emailPassword
            }
        });
        const mailOptions = {
            from:config.emailUser,
            to:email,
            subject:'for reset password',
            html: '<p>Hyy '+name+" "+"this is your verify opt " +"  "+  otp+' "</p>'
        }
        transporter.sendMail(mailOptions,function(error,info){
            if(error){
                console.log(error);
            }
            else{
                console.log("email has been sent :-",info.response);
            }
        })
        
    }catch(error){
        console.log(error.message);
    }
}

const generateOrderID = async () => {
    try {
      const timestamp = new Date().getTime();
      const random = Math.floor(Math.random() * 1000);
      return `${timestamp}-${random}`;
    } catch (error) {
      console.log(error.message);
      throw error; 
    }
  }

  const verifyOrderPayment = (details) => {
    console.log("DETAILS : " + JSON.stringify(details));
    return new Promise((resolve, reject) => {
      const crypto = require('crypto');
  
      let hmac = crypto.createHmac('sha256', 'WddAOWAHJzBQvRvnqHRh8JCN');
      hmac.update(
        String(details['order']['generateOrder']['id']) + '|' +
        String(details['payment']['razorpay_payment_id'])
      );
      hmac = hmac.digest('hex');
  
      console.log('orderid', details['order']['generateOrder']['id']);
      console.log('paymentid', details['payment']['razorpay_payment_id']);
      console.log('signature', details['payment']['razorpay_signature']);
  
      if (hmac === details['payment']['razorpay_signature']) {
        console.log("Verify SUCCESS");
        resolve();
      } else {
        console.log("Verify FAILED");
        reject();
      }
    });
  };
  
//wallet
  const updateWalletBalance = async (userId, amount, transactionType,orderType)=> {
    try {
      let wallet = await Wallet.findOne({user: userId });
  
      if (!wallet) {
        wallet = new Wallet({
          user: userId,
          balance: 0, 
          transactions: [], 
        });0
      }
  
      if (transactionType === 'debit') {
        if (wallet.balance >= amount) {
          wallet.balance -= Math.abs(amount); 
        } 
      } else if (transactionType === 'credit') {
        wallet.balance += Math.abs(amount);
      } else {
        throw new Error('Invalid transaction type');
      }
  
      const newTransaction = {
        date: new Date(),
        type: transactionType,
        amount: amount,
        orderType:orderType,
      };
  
      wallet.transactions.push(newTransaction);
  
      await wallet.save();
      
      return { success: true, message: 'Wallet updated successfully' };
    } catch (error) {
      console.error(error);
      return { success: false, message: error.message };
    }
  }
  


  const  calculateDeliveredOrderTotal= async ()=> {
    try { 
      const totalData = await Order.aggregate([
        {
          $match: {
            status: 'Delivered',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total_amount' },
            count: { $sum: 1 },
          },
        },
      ]);
  
      if (totalData.length === 0) {
       
        return [{
          _id: null,
          totalPriceSum: 0,
          count: 0,
        }];
      }
      
      return totalData;
    } catch (error) {
      throw error;
    }
  }
  
  
  const  calculateCategorySales= async ()=> { 
    try {
      const categorySalesData = await Order.aggregate([
        {
          $unwind: '$products',
        },
        {
          $lookup: {
            from: 'products',
            localField: 'products.product',
            foreignField: '_id',
            as: 'productDetails',
          },
        },
        {
          $unwind: '$productDetails',
        },
        {
          $match: {
            status: 'Delivered',
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'productDetails.categoryname',
            foreignField: '_id',
            as: 'categoryDetails',
          },
        },
        {
          $unwind: '$categoryDetails',
        },
        {
          $group: {
            _id: '$productDetails.categoryname',
            categoryName: { $first: '$categoryDetails.categoryname' },
            totalSales: {
              $sum: { $multiply: ['$productDetails.product_sales_price', '$products.quantity'] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            categoryName: 1,
            totalSales: 1,
          },
        },
      ]);
  
      return categorySalesData;
    } catch (error) {
      throw error;
    }
  }
  
  const  calculateDailySales= async ()=> {
    try {
      const dailySalesData = await Order.aggregate([
        {
          $match: {
            status: 'Delivered',
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
              },
            },
            dailySales: {
              $sum: '$total_amount',
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]);
  
      return dailySalesData;
    } catch (error) {
      throw error;
    }
  }
  
  const  calculateOrderCountByDate= async ()=> {
    try {
      const orderCountData = await Order.aggregate([
        {
          $match: {
            status: 'Delivered',
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$orderDate',
              },
            },
            orderCount: { $sum: 1 },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]);
  
      return orderCountData;
    } catch (error) {
      throw error;
    }
  }

  const  calculateProductsCount= async ()=> {
    try {
      const productCount = await Product.countDocuments();
  
      return productCount;
    } catch (error) {
      throw error;
    }
  }
  
  const  calculateOnlineOrderCountAndTotal= async ()=> {
    try {
      const onlineOrderData = await Order.aggregate([
        {
          $match: {
            paymentMethod: 'online',
            status: 'Delivered',
          },
        },
        {
          $group: {
            _id: null,
            totalPriceSum: { $sum: '$total_amount' },
            count: { $sum: 1 },
          },
        },
      ]);
  
      return onlineOrderData;
    } catch (error) {
      throw error;
    }
  }
  
  const  calculateCodOrderCountAndTotal= async ()=> {

    try {
      const codOrderData = await Order.aggregate([
        {
          $match: {
            paymentMethod: 'cod',
            status: 'Delivered',
          },
        },
        {
          $group: {
            _id: null,
            totalPriceSum: { $sum: '$total_amount' },
            count: { $sum: 1 },
          },
        },
      ]);
  
      return codOrderData;
    } catch (error) {
      throw error;
    }
  }
  const  calculateWalletOrderCountAndTotal= async ()=> {

    try {
      const codOrderData = await Order.aggregate([
        {
          $match: {
            paymentMethod: 'wallet',
            status: 'Delivered',
          },
        },
        {
          $group: {
            _id: null,
            totalPriceSum: { $sum: '$total_amount' },
            count: { $sum: 1 },
          },
        },
      ]);
  
      return codOrderData;
    } catch (error) {
      throw error;
    }
  }
  
  
  const  getLatestOrders= async ()=> {
    try {
      const latestOrders = await Order.aggregate([
        {
          $unwind: '$products',
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $limit: 10,
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userDetails',
          },
        },
        {
          $addFields: {
            username: {
              $arrayElemAt: ['$userDetails.name', 0],
            },
            address: {
              $arrayElemAt: ['$userDetails.address.name', 0],
            },
          },
        },
        {
          $project: {
            userDetails: 0,
          },
        },
      ]);
  
      return latestOrders;
    } catch (error) {
      throw error;
    }
  }
  
  
  
  const  calculateListedCategoryCount= async ()=> {
    try {
      const listedCategoryCount = await Category.countDocuments({ isListed: true });
  
      return listedCategoryCount;
    } catch (error) {
      throw error;
    }
  }
  
  

  module.exports={
    // insertUser,
    securePassword,
    sendVerifyMail,
    sendResetPasswordMail,
    generateOrderID ,
    verifyOrderPayment,
    updateWalletBalance,
    calculateDeliveredOrderTotal,
    calculateCategorySales,
    calculateDailySales,
    calculateOrderCountByDate,
    calculateListedCategoryCount,
    calculateProductsCount,
    calculateOnlineOrderCountAndTotal,
    calculateCodOrderCountAndTotal,
    calculateWalletOrderCountAndTotal,
    getLatestOrders
  }