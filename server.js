const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db');
const colors = require('colors');
const errorHandler = require('./middleware/error');

//Router files
const bootcamps = require('./routes/bootcamps');

//Load Env Vars
dotenv.config({ path: './config/config.env' });

//Connect to Database
connectDB();

const app = express();

//Body Parser 
app.use(express.json());

//Dev Loggin middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//Mount routers
app.use('/api/v1/bootcamps', bootcamps);

app.use(errorHandler);

const PORT = process.env.PORT || 9000;

const server = app.listen(PORT, () => {
  console.log(
    `App running in ${process.env.NODE_ENV} mode on port ${process.env.PORT}!`
  .yellow.bold);
});

//Handle UnHandled Rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  //Close Server and Exist Process
  server.close(() => process.exit(1));
});
