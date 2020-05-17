const path = require('path');
const express = require('express');
const colors = require('colors');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const mongoSanitizer = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
// const logger = require('./middleware/logger');
const morgan = require('morgan');
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');


// load env vars
dotenv.config({path: './config/config.env'});
// connect to database
connectDB();
// route files 
const bootcamps = require('./routes/bootcamp');
const courses = require('./routes/courses');
const auth = require('./routes/auth');
const users = require('./routes/users');
const reviews = require('./routes/reviews');

const app = express();
// Body parser
app.use(express.json());
// Cookie parser
app.use(cookieParser());
// config logger
if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// fileupload
app.use(fileupload());
// sanitize data
app.use(mongoSanitizer());
// set security headers
app.use(helmet());
// prevent XSS attack
app.use(xss());
// rate limiting
const limiter = rateLimit({
    windowMs: 10*60*1000, // 10 min
    max: 100
})
app.use(limiter);
// http param pollution
app.use(hpp());
// enable cors
app.use(cors());
// set static folder
app.use(express.static(path.join(__dirname, 'public')))
// mount routers
app.use('/api/v1/bootcamps', bootcamps);
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/reviews', reviews);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server =app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} at port number ${PORT}`.yellow.bold);
});
// handle unhandled promise rejection
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error : ${err.message}`);
    // close server and exit process
    server.close( () => {
        process.exit(1)
    }) 
    
})