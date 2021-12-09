const mongoose = require('mongoose');

const connectDb = async () =>{
    const conn = await mongoose.connect(process.env.MONGO_URI,{
        useNewUrlParser: true,
        useUnifiedTopology:true
    });

    console.log(`Mongo DB Connected ${conn.connection.host}`.cyan.underline.bold);
}

module.exports = connectDb;