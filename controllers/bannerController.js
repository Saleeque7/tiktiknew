const Banner  = require ("../model/bannerModel")

const addBanner = async (req,res)=>{
    try {
        res.render('addbanner')
    } catch (error) {
        console.log(error.message);
    }
}

const add_banner = async (req,res)=>{
try {
    const {titleOne , titleTwo , titleThree} =req.body
    const image = req.file.filename
    const newBanner = new Banner({
     titleOne,
     titleTwo,
     titleThree,
     bannerImage:image,
    });
 
    await newBanner.save()
    res.redirect('/admin/banner_list')
    
} catch (error) {
    console.log(error.message);
    res.redirect('/admin/404')
}
}

const banner_list = async(req,res)=>{
    try {
        const banner = await Banner.find()
        res.render('bannerList',{data:banner})
    } catch (error) {
        console.log(error.message);
        res.redirect('/admin/404')
    }
}

const edit_banner = async(req,res)=>{
    try {
    const {id} =req.query
    const banner = await Banner.findOne({_id:id})
    if(!banner){
        res.redirect('/admin/404')
    }
    res.render('editBanner',{data:banner})
    } catch (error) {
        console.log(error.message);
        res.redirect('/admin/404')
    }
}

const edited_banner = async(req,res)=>{
    try {
        const {titleOne , titleTwo , titleThree} = req.body
        const {id} =req.query
        const existingBanner = await Banner.findById(id)
        if(req.file){
            existingBanner.bannerImage = req.file.filename
        }
        existingBanner.titleOne = titleOne
        existingBanner.titleTwo = titleTwo
        existingBanner.titleThree = titleThree
       
        const bann = await existingBanner.save()

        res.redirect('/admin/banner_list')
        
    } catch (error) {
        console.log(error.message);
        res.redirect('/admin/404')
    }
}

const delete_banner = async (req,res)=>{
    try{
        const id = req.params.id
        const banner = await Banner.deleteOne({_id:id})
        res.redirect('/admin/banner_list')
        
    }catch(error){
        console.log(error.message);
        res.redirect('/admin/404')
    }
}

const loadbanner = async(req,res)=>{
try {
    res.render()
} catch (error) {
    console.log(error.message);
}
}
module.exports = {
    addBanner,
    add_banner,
    banner_list,
    edit_banner,
    edited_banner,
    delete_banner,
    loadbanner
}