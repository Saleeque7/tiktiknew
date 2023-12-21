const Category = require("../model/categoryModel");
const Product = require("../model/productModel");
const Multer = require('multer');



const   getCategory = async (req, res)=>{
  try {
   
    const categories = await Category.find();
      res.render('categories',{categories})
  } catch (error) {
      console.log(error);
      res.redirect('/admin/404')
  }
}


const addCategory = async (req, res) => {
  try {
    const { categoryname, Offer_price } = req.body;

    if (!categoryname) {
      res.json({success:false,message:"Category name cannot be empty"});
      return;
    }
    if (categoryname.length <= 3) {
      res.json({success:false,message:"Category name must be at least 3 characters long"});
      return false;
    }

    const existingCategory = await Category.findOne({
      categoryname: { $regex: '^' + categoryname + '$', $options: 'i' }
    });
    if(existingCategory){
      res.json({success:false,message:"Category already exists"});
    }else{
      const newCategory = new Category({
        categoryname: categoryname,
        offer:Offer_price
      });
      await newCategory.save();
      res.json({success:true})
    }

  } catch (error) {
    console.log(error.message);
  }
};




const edit_category = async(req, res)=>{
  try {
    const categoryId=req.query.id;
    const categories = await Category.findById(categoryId)
    res.render('edit_category',{categories})
  } catch (error) {
    console.log(error.message);
    res.redirect('/admin/404')
  }
}


const List_category = async (req, res) => {
  try {
    const categoryId = req.query.id;
    await Category.findByIdAndUpdate(categoryId, { isListed: true });
    const category = await Category.findById(categoryId)

    if(category.isListed){
      const products = await Product.find({categoryname:categoryId})
      for(let product of products){
        const effectiveOfferPercentage = Math.min(category.offer, product.product_offer);
        const offer = product.product_price*effectiveOfferPercentage/100
        const offerPrice =Math.round(product.product_price-offer)   
        await Product.findByIdAndUpdate(product._id, {
          offer: effectiveOfferPercentage,
          product_sales_price: offerPrice,
        });
      }
    }

    res.redirect("/admin/category"); 
  } catch (error) {
    console.log(error.message);
    res.redirect('/admin/404')
  }
};

const unList_category = async (req, res) => {
  try {
    const categoryId =req.query.id;
    await Category.findByIdAndUpdate(categoryId, { isListed: false });
    const category = await Category.findById(categoryId)
    if(!category.isListed){
      const products = await Product.find({categoryname:categoryId})
      for(let product of products ){
        const effectiveOfferPercentage = product.product_offer
        const offer = product.product_price*effectiveOfferPercentage/100
        const offerPrice =Math.round(product.product_price-offer) 
        await Product.findByIdAndUpdate(product._id, {
          offer: effectiveOfferPercentage,
          product_sales_price: offerPrice,
        });
      }
    
    }
    
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error.message);
    res.redirect('/admin/404')
  }
};


const deleteCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const category = await Category.findById(id)
    if(category.isListed || !category.isListed){
      const products = await Product.find({categoryname:id})
      for(let product of products ){
        const effectiveOfferPercentage = product.product_offer
        const offer = product.product_price*effectiveOfferPercentage/100
        const offerPrice =Math.round(product.product_price-offer) 
        await Product.findByIdAndUpdate(product._id, {
          offer: effectiveOfferPercentage,
          product_sales_price: offerPrice,
        });
      }
    }
    const updateinfo =await Category.deleteOne({ _id: id });

    res.redirect("/admin/category");
  } catch (error) {
    console.log(error.message);
    res.redirect('/admin/404')
  }
};

const edited_category = async(req,res)=>{
  try {
    const { requestData,categoryid } = req.body

    const products = await Product.find({categoryname:categoryid})
    const category = await Category.findById(categoryid)
    products.forEach(async(product)=>{
      const minProductOffer = Math.min(product.offer,requestData.Offer_price);
      
        product.offer = minProductOffer;
        const offerPrice = product.product_price*minProductOffer/100
        product.product_sales_price =Math.round(product.product_price-offerPrice) 
        await product.save();
    
    })
    if(!category){
      return res.json({success:false,message:"category is not available"})
    }
    category.categoryname = requestData.categoryname
    category.offer =  requestData.Offer_price
    category.save()
    return res.json({success:true})

  } catch (error) {
    console.log(error.message);
    res.redirect('/admin/404')
  }
}


module.exports = {
  getCategory,
  addCategory,
  unList_category,
  List_category,
  deleteCategory,
  edit_category,
  edited_category
}