const dotenv = require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const userRoute = require('./routes/userRoute')
const errorHandler = require('./middleware/errorMiddleware')
const cookieParser = require('cookie-parser');


const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(cors({
    origin:["http://localhost:3000","https://gpassword-reset-app.vercel.app"],
    credentials:true,
}));


// Routes Middleware
app.use("/users",userRoute)

app.get('/',(req,res)=>{
    res.send("hi")
})

// error middleware

app.use(errorHandler);


const PORT = process.env.PORT || 5000;

// mongodb connect

mongoose.connect(process.env.MONGO_URI).then(()=>{
    app.listen(PORT,()=>{
        console.log(`Server running on port: ${PORT}`)
    })
})
.catch((err)=>{
    console.log(err)
})