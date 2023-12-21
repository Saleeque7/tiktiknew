const mongoose=require('mongoose')

const walletSchema= new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    balance:{
        type:Number,     
        default:0
    },
    transactions: [
        {
            date: {
                type: Date,
                default: Date.now
            },
            type: {
                type: String, 
                default: false
            },
            orderType: {
                type: String, 
                default: false
            },
            amount: {
                type: Number,
                default: false
            }
        }
    ]
})

module.exports = mongoose.model('Wallet',walletSchema)