const Product = require("../model/productModel");
const path = require('path')
const cropImage = require('../multer/cropProductImg')
const Category = require("../model/categoryModel");
const brands = require("../model/brandModel");



const getProduct = async (req, res)=>{
  try {
    const categories = await Category.find();
    const brand = await brands.find()
      res.render('product',{categories,brand})
  } catch (error) {
      console.log(error);
  }
}

const addProduct = async(req, res)=>{
  try {

    if (!req.files) {
      return res.status(400).send('No files were uploaded.');
    }
    const images = req.files.map(file => file.filename);
    await cropImage.crop(req)
    const {product_name , product_price , offer_price , quantity , brandName , categoryname  } = req.body
    const category = await Category.findOne({_id:categoryname})
  

    const effectiveOfferPercentage = Math.min(category.offer, offer_price);
    
    const offer = product_price*effectiveOfferPercentage/100
    const offerPrice =Math.round(product_price-offer) 

    const product = new Product({
      product_name:product_name,
      product_price:product_price,
      offer:effectiveOfferPercentage,
      product_offer:offer_price,
      product_sales_price:offerPrice,
      quantity:quantity,
      brandName:brandName,
      categoryname:categoryname,
      image:images,

    });


    await product.save();
    res.redirect('/admin/productList')
  } catch (error) {
    console.log(error);
  }
}

const listProduct = async(req, res)=>{
      try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = 5;

        const totalProducts = await Product.countDocuments();

        const totalPages = Math.ceil(totalProducts / pageSize);
        const skip = (page - 1) * pageSize;


        const products = await Product.find().sort({ createdAt: -1 }).skip(skip)
        .limit(pageSize);
;
        const categories = await Category.find();
        res.render('productList',{products,categories,currentPage: page,
          totalPages,
})
        await cropImage.crop(req)
      } catch (error) {
        console.log(error);
      }
}


const editLoad = async (req,res)=>{
  try {
    const productId = req.query.id;
    const product = await Product.findById( productId );
    const brand = await brands.find()
    const categories = await Category.find();

      if(product){
        res.render('editProduct', { product, categories, brand });
      }else{
        res.redirect('/admin')

      }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('404', { message: "Internal server error" });

  }
  
}

const editProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const {
      product_name,
      product_price,
      offer_price,
      quantity,
      brandName,
      categoryname,
    } = req.body;

    const existingProduct = await Product.findById(id);
    const categoryId = existingProduct.categoryname
    const category = await Category.findOne({_id:categoryId})

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }


    if (req.files.length != 0) {
      await cropImage.crop(req);
      const images = req.files.map(file => file.filename);
      const productData = existingProduct
      if (productData.image.length < 4) {

          for (let i = 0; i < images.length; i++) {
              productData.image.push(images[i])
              if (productData.image.length == 4) {
                  break
              }
          }   
          await productData.save()
      }
  } 


     const effectiveOfferPercentage = Math.min(category.offer, offer_price);
     const offer = product_price*effectiveOfferPercentage/100
     const offerPrice =Math.round(product_price-offer) 
    
    existingProduct.product_name = product_name;
    existingProduct.product_price = product_price;
    existingProduct.offer = effectiveOfferPercentage;
    existingProduct.product_offer = offer_price;
    existingProduct.product_sales_price = offerPrice;
    existingProduct.quantity = quantity;
    existingProduct.brandName = brandName;
    existingProduct.categoryname = categoryname;

    await existingProduct.save();

    res.redirect('/admin/productlist');
  } catch (error) {
    res.status(500).render('404', { message: "Internal server error" });
    console.error(error.message);
  }
};


const deleteProduct = async(req,res)=>{
  try {
    const id = req.query.id
    const updateInfo = await Product.deleteOne({_id:id})
    res.redirect("/admin/productlist")
  } catch (error) {
    console.log(error.message);
  }
}


const getProductDetails = async(req, res)=>{
  try {
    const productId = req.params._id;

    const product = getProductDetails(productId);
    if (!product) {
      return res.status(404).render('404',{message:"Product not found"});
  }

  res.render('users/productDetails', { product });

    const products = await Product.find();
    res.render('productDetails',{products})
  } catch (error) {
    console.log(error);
  }
}

const showProductDetails = async(req, res)=>{
  try {
    const productId = req.params._id;

    const product = showProductDetails(productId);
    if (!product) {
      return res.status(404).render('404',{message:"product is not found"});
  }

  res.render('users/singleProduct', { product });

    const products = await Product.find();
    res.render('singleProduct',{products})
  } catch (error) {
    console.log(error);
  }
}



const loadBrand = async(req,res)=>{
  try {
    const Brand  =  await brands.find()
    res.render('brands',{Brand})
  } catch (error) {
    console.log(error.message);
  }
}

const addBrand = async (req, res) => {
  try {
    const {brandName}= req.body
    if (!brandName) {
      res.json({success:false,message:"brand name cannot be empty"});

      return;
    }
    

    const existingBrand = await brands.findOne({
      brandName: { $regex: '^' + brandName + '$', $options: 'i' }
    });

    if (existingBrand) {
      res.json({success:false,message:"Brand already exists"});
    } else {
      const newBrand = new brands({
        brandName: brandName, 
      });

      await newBrand.save();

      res.json({success:true})
    }
  } catch (error) {
    console.log(error.message);
  }
};
const edit_brand = async(req,res)=>{
  try {
    const  brandId = req.query.id
    const brand = await brands.findById(brandId)
    res.render('edit_brand',{brand})
  } catch (error) {
    console.log(error.message);
    res.redirect('/admin/404')
  }
}

const edited_brand = async(req,res)=>{
  try {
    const { requestData,brandid } = req.body

    const brand = await brands.findById(brandid)
    if(!brand){
      return res.json({success:false,message:"brand is not available"})
    }
    brand.brandName = requestData.brandName
    brand.save()
    return res.json({success:true})
  } catch (error) {
    console.log(error.message);
    res.redirect('/admin/404')
  }
}


const deleteBrand = async(req,res)=>{
  try {
    const id = req.query.id
    const updateInfo = await brands.deleteOne({_id:id})
    res.redirect("/admin/brand");
  } catch (error) {
    console.log(error.message);
  }
}

const deteEditeproduct = async (req, res) => {
  try {
      const productId = req.body.productId
      const removeindex = req.body.index
      const findProduct = await Product.findOne({ _id: productId })
      if (!findProduct) {
          res.status(404).send('Product not found');
      } else {
          findProduct.image.splice(removeindex, 1)
          findProduct.save()

          res.status(200).json({ message: 'Product image deleted successfully', product: findProduct });
      }
  }
  catch (error) {
      console.log(error.message);
      res.redirect('/admin/404')
    }
}


const List_brand = async (req, res) => {
  try {
    const brandId = req.query.id;
    await brands.findByIdAndUpdate(brandId, { isListed: true });
    res.redirect("/admin/brand"); 
  } catch (error) {
    console.log(error.message);
    res.redirect('/admin/404')
  }
};

const unList_brand = async (req, res) => {
  try {
    const brandId =req.query.id;
    await brands.findByIdAndUpdate(brandId, { isListed: false });
    res.redirect("/admin/brand");
  } catch (error) {
    console.log(error.message);
    res.redirect('/admin/404')
  }
};




module.exports = {
  getProduct,
  addProduct,
  editLoad,
  editProduct,
  listProduct,
  getProductDetails,
  showProductDetails,
  loadBrand,
  addBrand,
  deleteBrand,
  deleteProduct,
  deteEditeproduct,
  edit_brand,
  edited_brand,
  List_brand,
  unList_brand
}