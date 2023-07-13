const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    name:{
        type:String,
        required :[true,"Please Add Your Name"]
    },
    email:{
        type:String,
        required :[true,"Please Add Your Email"],
        unique:true,
        trim:true,
        match:[
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please Add a valid Email"
        ]
    },
    password:{
        type:String,
        required :[true,"Please Add a Password"],
        minLength:[6,"Password must be upto 6 characters"],
    
    }
})


userSchema.pre("save",async function(next){
    if(!this.isModified('password')){
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password,salt);
    this.password = hashedPassword
    next();
})

const User = mongoose.model("User", userSchema)

module.exports = User