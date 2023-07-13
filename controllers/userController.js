const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const Token = require('../models/tokenModel');
const crypto = require('crypto');
const sendEmail = require('../utlis/sendEmail');






const generateToken = (id)=>{
    return jwt.sign({id},process.env.JWT_SECRET,{expiresIn:"1d"})
}



const registerUser =asyncHandler(async(req,res)=>{
    const {name,email,password} = req.body
    
    //validation
    if(!name || !email || !password){
        res.status(400)
        throw new Error("Please Fill all the Fields");
    }
    if(password.lenght<6){
        res.status(400)
        throw new Error("Password must be upto 6 characters")
    }
    // if email already exists

    const userExists= await User.findOne({email})
    if(userExists){
        res.status(400)
        throw new Error("The User Already Exists");
    }

    
    // encrypt password
    const salt = await bcrypt.genSalt(5)
    const hashedPassword = await bcrypt.hash(password,salt)

    const user = await User.create({
        name,
        email,
        password
    })

    const token = generateToken(user._id);

    // http-cookie

    res.cookie('token',token,{
        path:'/',
        httpOnly:true,
        expires : new Date(Date.now()+1000*8600),
        sameSite:'none',
        secure:true
    })

    if(user){

        const {_id,name,email}=user 
        res.status(201).json({
            _id,name,email,token
        })
    }
    else{
        res.status(400)
        throw new Error("An Invalid User Data")
    }
}
)

const loginUser = asyncHandler(async(req,res)=>{
    const {email,password}= req.body;

    if(!email || !password){
        res.status(400)
        throw new Error("Please add email and password");
    }

    const user = await User.findOne({email});
    if(!user){
        res.status(400)
        throw new Error("User not found! Please Register")
    }

    const passwordIsCorrect = await bcrypt.compare(password,user.password)

    const token = generateToken(user._id);

    // http-cookie

    res.cookie('token',token,{
        path:'/',
        httpOnly:true,
        expires : new Date(Date.now()+1000*8600),
        sameSite:'none',
        secure:true
    })

    if(user && passwordIsCorrect){
        const {_id,name,email} = user;
        res.status(201).json({
            _id,name,email,token
        })
    } 
    else{
        res.status(400)
        throw new Error("Invalid Email or Password")
    }

})

const logout = asyncHandler(async(req,res)=>{
    res.cookie('token','', {
        path:'/',
        httpOnly:true,
        expires:new Date(0),
        sameSite : 'none',
        secure:true
    });
    return res.status(200).send({
        message:"Successfully logged out"
        })
})

const forgotPassword = asyncHandler(async(req,res)=>{
    const {email} = req.body
    const user = await User.findOne({email})

    if(!user){
        res.status(400).send("User does not exists")
    }

    let token = await Token.findOne({userId:user._id})
    if(token){
        await token.deleteOne();
    }
    let resetToken = crypto.randomBytes(32).toString('hex')+user._id
    console.log(resetToken)

    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    // console.log(hashedToken)

    await new Token({
        userId:user._id,
        token:hashedToken,
        createdAt:Date.now(),
        expiresIn:Date.now()+30*(60*1000)
        }).save()
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`

    const message = `
    <h2>Hai ${user.name}</h2>
    <p> Please find the url below to reset your password.</p>
    <p>The reset link is valid for 30 minutes.</p>
    <a href = ${resetUrl} clicktracking = off> ${resetUrl}</a>
    <p>Regards<p>
    <p>Admin Team</p>`

    const subject = 'Reset Password Email'
    const send_to = user.email
    const sent_from = process.env.EMAIL_USER

    try{
        await sendEmail(subject,message,send_to,sent_from)
        res.status(200).send("Reset Email Sent Successfully")
    }
    catch(error){
        res.status(400)
        throw new Error("Email Not sent")
    }
})

const resetPassword = asyncHandler(async(req,res)=>{
    const {password} = req.body
    const {resetToken} = req.params

    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    const userToken = await Token.findOne({
        token :hashedToken,
        expiresIn:{$gt:Date.now()}

    })
    if(!userToken){
        res.status(404).send("Token Expired")
    }
    const user = await User.findOne({_id:userToken.userId})
    user.password = password
    await user.save()
    res.status(200).send("Password resetted")
})

module.exports ={
    registerUser,
    loginUser,
    logout,
    forgotPassword,
    resetPassword
}