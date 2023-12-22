const Order = require("../model/orderModel");
const Address = require("../model/addressModel");
const product = require("../model/productModel");
const Cart = require("../model/cartModel");
const Brand = require("../model/brandModel")
const User = require("../model/userModel");
const helper = require("../helper/userHelper");
const Razorpay = require('razorpay');
const Wallet = require("../model/walletModel")
const mongoose=require('mongoose')
const easyinvoice = require("easyinvoice");
const fs = require("fs");
const { Readable } = require('stream');
const CryptoJS = require('crypto-js');
require("dotenv").config();

const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

const razorpayInstance = new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY
});



const makeOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { addressId, payment_option, GrandTotal } = req.body;

    const userAddress = await Address.findOne({ user: userId, 'addresses.isDefault': true });
    const userCart = await Cart.findOne({ user: userId }).populate('products.product');
    const orderId = await helper.generateOrderID();
    let allProductsInStock = true;

    if (!userAddress) {
      return res.status(400).json({ success: false, message: 'select an address' });
    }

    if (!userCart || userCart.products.length === 0) {
      return res.status(400).send('No products in the cart to order.');
    }

    for (const item of userCart.products) {
      const Product = await product.findById(item.product._id);
      if (Product) {
        if (Product.quantity < item.quantity) {
          allProductsInStock = false;
          break; 
        }
      }
    }

    if (!allProductsInStock) {
      return res.status(400).json({ success: false, message: 'Some products are out of stock.' });
    }
  
    const order = new Order({
      user: userId,
      products: userCart.products,
      shippingAddress: userAddress.addresses.find(address => address.isDefault),
      orderId: orderId,
      paymentMethod: payment_option,
      total_amount: GrandTotal
    });

  

    const savedOrder = await order.save();
    for (const item of userCart.products) {
      const Product = await product.findById(item.product._id);
      const newQuantity = Product.quantity - item.quantity;
      await product.updateOne({ _id: item.product._id }, { quantity: newQuantity });
      
    }

    userCart.products = [];
    await userCart.save();


    res.send('Order processed successfully');
  } catch (error) {
    console.log(error.message);
  }
};


 const orderComplete = async(req,res)=>{
  try {
    const userId = req.session.user_id
    const user = await User.findOne({_id:userId})
    const orders = await Order.find().populate('products.product')
    const cart = await Cart.findOne({user:userId})
    res.render('orderComplete',{orders,user,cart})
  } catch (error) {
    console.error(error.message)
  }
 }


 const listOrder = async (req, res) => {
  try {  
    const page = parseInt(req.query.page) || 1;
        const pageSize = 5;

        const totalOrders = await Order.countDocuments();

        const totalPages = Math.ceil(totalOrders / pageSize);
        const skip = (page - 1) * pageSize;
        const userId = req.session.user_id
    const orders = await Order.find({user:userId}).populate("products.product").sort({ createdAt: -1 }).skip(skip).limit(pageSize);
    res.render('orderDetails', { orders, currentPage: page,
      totalPages,
});
  } catch (error) {
    console.log(error.message);
  }
};


// --------------------------online pament ----------------------------------------------------------------------

const makeOnlineOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { addressId, payment_option, GrandTotal } = req.body;

    const [userAddress, userCart, user] = await Promise.all([
      Address.findOne({ user: userId, 'addresses.isDefault': true }),
      Cart.findOne({ user: userId }).populate('products.product'),
      User.findOne({ _id: userId }),
    ]);

     if (!userAddress) {
      return res.json({ success: false, msg: 'select an address' });
    }

    if (!userCart || userCart.products.length === 0) {
      return res.status(400).send({ success: false, msg: 'No products in the cart to order.' });
    }

    for (const item of userCart.products) {
      const Product = await product.findById(item.product._id);
      if (!Product || Product.quantity < item.quantity) {
        return res.json({ success: false, msg: 'Some products are out of stock.' });
      }
    }
    
    

    const options = {
      amount: GrandTotal * 100,
      currency: 'INR',
    };

    const createRazorpayOrder = () =>
      new Promise((resolve, reject) => {
        razorpayInstance.orders.create(options, (err, order) => {
          if (err) {
            reject(err);
          } else {
            resolve(order);
          }
        });
      });

    const razorpayOrder = await createRazorpayOrder();

    if (razorpayOrder) {
      const order = new Order({
        user: userId,
        products: userCart.products,
        shippingAddress: userAddress.addresses.find((address) => address.isDefault),
        orderId: razorpayOrder.id,
        paymentMethod: payment_option,
        total_amount: GrandTotal,
      });
      req.session.newOrder = order;

      return res.status(200).send({
        success: true,
        msg: 'Order Created',
        order_id: razorpayOrder.id,
        amount: GrandTotal * 100,
        key_id: RAZORPAY_ID_KEY,
        product_name: 'watches',
        name: user.name,
        phone: user.mobile,
        email: user.email,
      });
    } else {
      return res.status(400).send({ success: false, msg: 'Razorpay order creation failed.' });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({ success: false, msg: 'Something went wrong!' });
  }
};



const verifyPayment = async (req, res) => {
  const userId = req.session.user_id;
  const user = await User.findOne({ _id: req.session.user_id });
  const cart = await Cart.findOne({ user: userId }).populate('products.product');
  try {
    const { GrandTotal, orderid } = req.body;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = orderid;
    helper.verifyOrderPayment({
      order: {
        generateOrder: {
          id: razorpay_order_id
        }
      },
      payment: {
        razorpay_payment_id,
        razorpay_signature
      }
    })
      .then(async () => {

        for (const item of cart.products) {
          const product = item.product;
          const newQuantity = product.quantity - item.quantity;
          if (newQuantity < 0) {
            return res.status(400).json({ status: false, errMsg: 'Product quantity is insufficient.' });
          }
          product.quantity = newQuantity;
          await product.save();
        }
        const orders = req.session.newOrder
        const saveOrder = new Order(orders)
        await saveOrder.save()
          
      cart.products = [];
      await cart.save();

        res.json({ status: true });

      }).catch((err) => {
        console.log(err);
        res.json({ status: false, errMsg: 'Payment failed!' });
      });
  } catch (err) {
    console.log(err);
    res.json({ status: false, errMsg: 'Payment failed!' });
  }
}

const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }
    if (order.orderStatus === 'Delivered') {
      return res.status(400).json({ message: 'Cannot cancel a delivered order' });
    }
    const currentDate = new Date();
    const orderDate = order.createdAt;
    const daysDifference = Math.floor((currentDate - orderDate) / (1000 * 60 * 60 * 24));
    if (daysDifference > 10) {
      return res.status(400).json({ message: 'Cannot cancel an order placed for more than 10 days' });
    }

  if (order.paymentMethod == 'cod' || order.paymentMethod == 'online' || order.paymentMethod == 'wallet' ) {
    for (const item of order.products) {
      const productId = item.product._id;
      const quantity = item.quantity;
      
      const Product = await product.findById(productId);
      if (Product) {
        Product.quantity += quantity;
        await Product.save();
      }
    }
  }


  if (order.paymentMethod !== 'cod') {
    const canceledAmount = order.total_amount;
  const userId = order.user;
  const orderType = order.paymentMethod
  const transactionType = 'credit';
  
  await helper.updateWalletBalance(userId, canceledAmount, transactionType,orderType);
}


    order.status = 'Cancelled';
    const orderssss = await order.save();

    console.log('Order Cancelled:', orderssss);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' ,success: false});
  }
};


const orderReturn = async (req, res) => {
  try {
    const { orderId, selectedReason } = req.body; 
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
  
    if (!order.status == 'Delivered') {
      return res.status(400).json({ message: 'Cannot return an order that is not delivered' });
    }

    const currentDate = new Date();
    const orderDate = order.createdAt;
    const daysDifference = Math.floor((currentDate - orderDate) / (1000 * 60 * 60 * 24));

    if (daysDifference > 10) {
      return res.status(400).json({ message: 'Cannot return an order placed for more than 10 days' });
    }
   
    if (order.paymentMethod) {

      const canceledAmount = order.total_amount;
      const userId = order.user;
      const orderType  = order.paymentMethod
      const transactionType = 'credit';
      await helper.updateWalletBalance(userId, canceledAmount, transactionType,orderType);
  }

    order.status = 'Returned';
    order.reasonResponse = selectedReason;
    await order.save();

    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};



const orderHistory = async(req,res)=>{
  try {
    const page = parseInt(req.query.page) || 1;
        const pageSize = 5;

        const totalOrders = await Order.countDocuments();

        const totalPages = Math.ceil(totalOrders / pageSize);
        const skip = (page - 1) * pageSize;

    
    const order = await Order.find().populate('user').sort({ createdAt: -1 }) .skip(skip)
    .limit(pageSize);
;
   
    res.render('userOrders',{order, currentPage: page,
      totalPages,})
  } catch (error) {
    console.log(error.message);
    res.redirect('/404')
  }
 }

 const orderDetailPage = async(req,res)=>{
  try {
    const orderId = req.params.orderId
    const order = await Order.findById(orderId).populate("products.product").populate("user")
    res.render('orderdtl',{order})
  } catch (error) {
    console.log(error.message);
    res.redirect('/404')
  }
 }

 const updateStatus = async (req, res) => {
  try {

    const { orderId } = req.params;
    const { newStatus } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'Delivered') {
      return res.status(400).json({ message: 'Order is already delivered' });
    }
    if (order.status === 'Returned') {
      return res.status(400).json({ message: 'Order is already Returned' });
    }
    if (order.status === 'Cancelled') {
      return res.status(400).json({ message: 'Order is already canceled' });
    }
    order.status = newStatus;

    if (newStatus === 'Delivered') {
      order.delivered = {
        deliveredDate: new Date(),
      };
    }
 
    await order.save();

    res.json({ success: true });

  } catch (error) {
    res.redirect('/404')
  }
}



const makewalletOrder = async(req,res)=>{
  try {

    const userId = req.session.user_id
    const {addressId,payment_option,GrandTotal}=req.body
    const [userAddress, userCart, user] = await Promise.all([
      Address.findOne({ user: userId, 'addresses.isDefault': true }),
      Cart.findOne({ user: userId }).populate('products.product'),
      User.findOne({ _id: userId }),
    ]);
 
  const wallet = await Wallet.findOne({ user: userId });
  let allProductsInStock = true;

    const orderId = await helper.generateOrderID();
     if (!userAddress) {
      return res.json({ success: false, msg: 'select an address' });
    }

    if (!userCart || userCart.products.length === 0) {
      return res.status(400).send({ success: false, msg: 'No products in the cart to order.' });
    }

    for (const item of userCart.products) {
      const Product = await product.findById(item.product._id);
      if (Product) {
        if (Product.quantity < item.quantity) {
          allProductsInStock = false;
          break; // At least one product is out of stock, no need to check the rest
        }
      }
    }

    if (!allProductsInStock) {
      return res.status(400).json({ success: false, message: 'Some products are out of stock.' });
    }
    

 if(wallet && wallet.balance >= GrandTotal ){
  const transactionType = 'debit';
  const updatedBalance = wallet.balance - GrandTotal;
  const orderType = payment_option
  wallet.balance = updatedBalance;
  await wallet.save();  

   const order = new Order({
     user: userId,
     products: userCart.products,
     shippingAddress: userAddress.addresses.find(address => address.isDefault),
     orderId: orderId,
     paymentMethod: payment_option,
     total_amount: GrandTotal
   })
   

   
   await order.save();
   for (const item of userCart.products) {
    const Product = await product.findById(item.product._id);
    const newQuantity = Product.quantity - item.quantity;
    await product.updateOne({ _id: item.product._id }, { quantity: newQuantity });
    
  }
   userCart.products = [];
   await userCart.save();
   await helper.updateWalletBalance(userId, GrandTotal, transactionType ,orderType);



   res.json({success:true, message:'Order processed successfully'});
} 
else {
   res.json({success:false, message: 'Insufficient balance in wallet' });
}   
  } catch (error) {
   console.log(error.message);
   return res.json({error: 'Internal server error' })
  }
}



const showWalletHistory = async (req, res) => {
  try {
      const page = req.query.page || 1;
      const itemsPerPage = 8;
      const userData = await User.findById(req.session.user_id);

      const wallet = await Wallet.findOne({ user: req.session.user_id });

const totalTransactions = wallet ? wallet.transactions.length : 0;

const totalPages = Math.ceil(totalTransactions / itemsPerPage);


      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;

      const sortedTransactions = wallet
          ? wallet.transactions.sort((a, b) => b.date - a.date)
          : [];
      const transactions = wallet
          ? wallet.transactions.slice(startIndex, endIndex)
          : [];

      res.render("walletHistory", {
          wallet,
          transactions,
          currentPage: page,
          totalPages,
          user:userData
      });
  } catch (error) {
      console.error(error);
      res.render("error", { message: "An error occurred." });
  }
};

const walletAddMoney = async(req,res)=>{
  try {
    const {amount}=req.body
    const user = await User.findOne({_id:req.session.user_id})
 
 if(!amount){
  return res.json({ success: false, msg: 'please enter amount' });
 }

    const options = {
      amount: amount * 100,
      currency: 'INR',
    };

    const createRazorpayOrder = () =>
      new Promise((resolve, reject) => {
        razorpayInstance.orders.create(options, (err, order) => {
          if (err) {
            reject(err);
          } else {
            resolve(order);
          }
        });
      });

    const razorpayOrder = await createRazorpayOrder();
      // product_name: 'watches',
    // order_id: razorpayOrder.id,

if(razorpayOrder){
  return res.status(200).send({
    success: true,
    msg: 'razorpay Created',
    amount: amount * 100,
    order_id: razorpayOrder.id,
    key_id: RAZORPAY_ID_KEY,
    name: user.name,
    phone: user.mobile,
    email: user.email,
  });
} else {
  return res.status(400).send({ success: false, msg: 'Razorpay order creation failed.' });
}
  } catch (error) {
    console.log(error.message);
    res.redirect("/404")
  }
}

const verifywalletAddMoney = async(req,res)=>{
  try {
    const user = await User.findOne({ _id: req.session.user_id });
    // const{GrandTotal,order_id} = req.body
    const { amount, type, orderid } = req.body;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = orderid;
    helper.verifyOrderPayment({
      order: {
        generateOrder: {
          id: razorpay_order_id
        }
      },
      payment: {
        razorpay_payment_id,
        razorpay_signature
      }
    })
      .then(async () => {
        const userId = req.session.user_id
        const canceledAmount = amount
        const orderType  = type
        const transactionType = 'credit';
        await helper.updateWalletBalance(userId, canceledAmount, transactionType,orderType);
        res.json({ status: true });
      }).catch((err) => {
        console.log(err);
        res.json({ status: false, errMsg: 'Payment failed!' });
      });
  } catch (err) {
    console.log(err);
    res.json({ status: false, errMsg: 'Payment failed!' });
  }
}



const getOrderInvoice = async (req, res) => {
  try {

   
    const {orderId , invoiceId }= req.query;
    if(orderId && invoiceId ){
      var id = CryptoJS.AES.decrypt(orderId, 'secretKey').toString(CryptoJS.enc.Utf8);
      var invoice = CryptoJS.AES.decrypt(invoiceId, 'secretKey').toString(CryptoJS.enc.Utf8);
    }

    const userId = req.session.user_id;
    const user = await User.findById(userId);

    const result = await Order.findOne({ _id: id });

    const date = result.createdAt.toLocaleDateString();
    const product = result.products;

    const order = {
      id: result.orderId,
      total: parseInt(result.total_amount),
      date: date,
      payment: result.paymentMethod,
      name: user.name,
      address: result.shippingAddress.address,
      town: result.shippingAddress.town,
      state: result.shippingAddress.state,
      country: result.shippingAddress.country,
      postalCode: result.shippingAddress.postalCode,
      email: result.shippingAddress.email,
      phoneNumber: result.shippingAddress.phoneNumber,
      product: result.products,
    };


    const products = order.product.map((product) => ({
      quantity: parseInt(product.quantity),
      description: product.product_name,
      "tax-rate": 0,
      price: parseInt(product.product_price),
    }));


    
    let data = {
      customize: {},
      images: {
        background: "https://public.easyinvoice.cloud/img/watermark-draft.jpg",
      },
      sender: {
        company: "TIKTIK",
        address: "LULU INTERNATIONAL,SHOPPING MALLS PVT. LTD,34/1000, N.H 47,EDAPALLY,",
        zip: "682 024",
        city: "KOCHI",
        country: "India",
      },
      client: {
        company: order.name,
        address: order.address,
        town: order.town,
        zip: order.postalCode,
        country: order.country,
      },
      information: {
        number: order.id,
        date: order.date,
        
      },
      products: products,
      "bottom-notice": "Thank you,Keep shopping.",
    };
    


    easyinvoice.createInvoice(data, async (invoiceResult) => {
      try {
        if (invoiceResult && invoiceResult.pdf) {
          // Use async write method
          await fs.promises.writeFile("invoice.pdf", invoiceResult.pdf, "base64");

          res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
          res.setHeader('Content-Type', 'application/pdf');

          const pdfStream = new Readable();
          pdfStream.push(Buffer.from(invoiceResult.pdf, 'base64'));
          pdfStream.push(null);

          pdfStream.pipe(res);
        } else {
          // Handle the case where invoiceResult.pdf is undefined or empty
          res.status(500).render('404',{message:"Error generating the invoice"});
        }
      } catch (writeError) {
        console.error("Error writing PDF file:", writeError);
          res.status(500).render('404',{message:"Error generating the invoice"});
      }
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).render('404', { message: "Something went wrong" });
  }
};


module.exports = {
  makeOrder,
  orderComplete,
  listOrder,
  makeOnlineOrder,
  verifyPayment,
  cancelOrder,
  orderReturn,
  orderHistory,
  orderDetailPage,
  updateStatus,
  makewalletOrder,
  showWalletHistory,
  walletAddMoney,
  verifywalletAddMoney,
  getOrderInvoice
};
