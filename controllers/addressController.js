const Address = require("../model/addressModel")

const loadAddress = async(req,res)=>{
    try {
        res.render('address')
    } catch (error) {
        console.log(console.error);
    }
}
const insertAddress = async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const newAddress = {
            address: req.body.address,
            town: req.body.town,
            country: req.body.country,
            state: req.body.state,
            postalCode: req.body.postalCode,
            email: req.body.email,
            phoneNumber: req.body.phoneNumber,
        };

        const existingUserAddress = await Address.findOne({ user: user_id });
      

        if (existingUserAddress) {
            
            existingUserAddress.addresses.push(newAddress);
            await existingUserAddress.save();
        } else {
            const userAddress = new Address({
                user: user_id,
                addresses: [newAddress],
            });
            await userAddress.save();
        }

        res.redirect("/getaddressList");
    } catch (error) {
        console.log(error.message);
    }
}

const getAddressList = async (req, res) => {
    try {
        const userAddress = await Address.find({ user: req.session.user_id });
        res.render('addressList', { userAddress });
    } catch (error) {
        console.log(error.message);
    }
}

const setDefault = async(req,res)=>{
    try {
        const { defaultAddress } = req.body;
         
    const userId = req.session.user_id; 

    await Address.updateMany({ user: userId }, { $set: { 'addresses.$[].isDefault': false } });

    await Address.findOneAndUpdate(
      { user: userId, 'addresses._id': defaultAddress },
      { $set: { 'addresses.$.isDefault': true } }
    );

    res.redirect('/getAddressList'); 
    } catch (error) {
        console.log(error.message);
    }
}



const editAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const addressId = req.query.id;

    const userAddress = await Address.findOne({ user: userId });
    const addressToEdit = userAddress.addresses.find(
      (address) => address._id.toString() === addressId
    );

    if (!addressToEdit) {

      return res.status(404).render('404'); 
    }

    res.render('editAddress', { address: addressToEdit });
  } catch (error) {
    console.error(error.message);
    res.redirect('/404'); 
  }
};

const changedAddress = async(req,res)=>{
    try {
        const addressId = req.query.id
        const {address,town,state,country,postalCode,email,phoneNumber} =req.body
        const userId =req.session.user_id
        const userAddress = await Address.findOne({ user: userId });

        if (!userAddress) {
          return res.status(404).render('404', { message: 'User not found' });
        }
        const existingUserAddress = userAddress.addresses.id(addressId);

          if(!existingUserAddress){
            res.status(404).render('404',{message:"address not found"})
          }
          existingUserAddress.address = address;
          existingUserAddress.town = town;
          existingUserAddress.state = state;
          existingUserAddress.country = country;
          existingUserAddress.postalCode = postalCode;
          existingUserAddress.email = email;
          existingUserAddress.phoneNumber = phoneNumber;
      
          await userAddress.save();
      
        res.redirect('/getaddressLIst')

    } catch (error) {
        console.log(error.message);
        res.status(404).redirect('/404')
    }
}


const setDefaultCheckout = async(req,res)=>{
    try {
        const {addressId} = req.body
       
        const userId = req.session.user_id; 

        await Address.updateMany({ user: userId }, { $set: { 'addresses.$[].isDefault': false } });
    
         await Address.findOneAndUpdate(
          { user: userId, 'addresses._id': addressId },
          { $set: { 'addresses.$.isDefault': true } }
        );

        const address = await Address.findOne({ user: userId, 'addresses.isDefault': true });
        

        res.json({success:true,message:"address selected SuccessFully....",address})
    } catch (error) {
        console.log(error.message);
        res.redirect('/404')
    }
}

const savechktAddress = async(req,res)=>{
    try {
  
        const {address ,town, state,country, postalCode ,email ,phone} = req.body
        const user_id = req.session.user_id;
        const newAddress = {
            address:address,
            town:town,
            country: country,
            state: state,
            postalCode:postalCode,
            email: email,
            phoneNumber: phone,
        };

    
        const existingUserAddress = await Address.findOne({ user: user_id });
      

        if (existingUserAddress) {
            
            existingUserAddress.addresses.push(newAddress);
            await existingUserAddress.save();
        } else {
            const userAddress = new Address({
                user: user_id,
                addresses: [newAddress],
            });
            await userAddress.save();
        }

   res.json({success:true,message:"Address added Successfully.....!"})

    } catch (error) {
        console.log(error.message);
    }
}
module.exports = {
    loadAddress,
    insertAddress,
    getAddressList,
    setDefault,
    editAddress,
    changedAddress,
    setDefaultCheckout,
    savechktAddress
}