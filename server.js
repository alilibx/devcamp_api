const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db');
const colors = require('colors');
const errorHandler = require('./middleware/error');
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const expressSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xssclean = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const expressRatelimit = require('express-rate-limit');

//Router files
const bootcamps = require('./routes/bootcamps');
const courses = require('./routes/courses');
const auth = require('./routes/auth');
const users = require('./routes/users');
const reviews = require('./routes/reviews');

//Load Env Vars
dotenv.config({ path: './config/config.env' });

//Connect to Database
connectDB();

const app = express();

//Body Parser
app.use(express.json());

//Cookie Parser
app.use(cookieParser());

//Dev Loggin middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//File Upload
app.use(fileUpload());

//Sanitize Data
app.use(expressSanitize());

//Set Security Headers
app.use(helmet());

//Prevent XSS Attack
app.use(xssclean());

//Prevent Params Polution Attack
app.use(hpp());

//Enable CORS
app.use(cors());

//Rate Limiting
const limiter = expressRatelimit({
  windowMs: 10 * 60 * 1000, // 10 Minutes
  max: 100,
});
app.use(limiter);

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

//Mount routers
app.use('/api/v1/bootcamps', bootcamps);
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/reviews', reviews);

app.use(errorHandler);

const PORT = process.env.PORT || 9000;

const server = app.listen(PORT, () => {
  console.log(
    `App running in ${process.env.NODE_ENV} mode on port ${process.env.PORT}!`
      .yellow.bold
  );
});

//Handle UnHandled Rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  //Close Server and Exist Process
  server.close(() => process.exit(1));
});
