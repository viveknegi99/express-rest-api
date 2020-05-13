const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const geocoder = require('../utils/geocoder');
const Bootcamp = require('../models/Bootcamp');
const asyncHandler = require('../middleware/async');
/**
 * @desc Get all bootcamps
 * @route GET api/v1/bootcamps
 * @access public
 */
exports.getBootcamps = asyncHandler(async (req, res, next) => {    
    res.status(200).json( res.advancedResults);       
}
)
/**
 * @desc Get single bootcamp
 * @route GET api/v1/bootcamps/:id
 * @access public
 */
exports.getBootcamp = asyncHandler(async (req, res, next) => {    
    const bootcamp = await Bootcamp.findById(req.params.id);
    if(!bootcamp) {
        return  next(new ErrorResponse(`Bootcamp not found with id of${req.params.id}`, 404));
    }
    res.status(200).json({success: true, data: bootcamp} );    
}
)

/**
 * @desc Create bootcamp
 * @route POST api/v1/bootcamps/
 * @access private
 */
exports.createBootcamp = asyncHandler(async (req, res, next) => {
    // add user to body
    req.body.user = req.user.id;
    // check for published bootcamp
    const camp = await Bootcamp.findOne({user: req.user.id});
    // if the user is not admin they can only add one bootcamp
    if(camp && req.user.role !=='admin') {
        return next( new ErrorResponse(`The user with id ${req.user.id} has already published a bootcamp`, 400));
    }
    const bootCamp = await Bootcamp.create(req.body);
    res.status(201).json({success: true, data: bootCamp} );  
}
)
/**
 * @desc Update bootcamp
 * @route PUT api/v1/bootcamps/:id
 * @access private
 */
exports.updateBootcamp = asyncHandler(async (req, res, next) => {    
    let bootcamp = await Bootcamp.findById(req.params.id);
    if(!bootcamp) {
        return  next(new ErrorResponse(`Bootcamp not found with id of${req.params.id}`, 404));
    }
    // make sure user is bootcamp owner
    if( bootcamp.user.toString() !== req.user.id && req.user.role !=='admin') {
        return  next(new ErrorResponse(`User ${req.user.id} is not authorized to update this course`, 401));
    } 
    bootcamp = await Bootcamp.findByIdAndUpdate( req.params.id, req.body, {
        new: true,
        runValidators: true
    })
    res.status(200).json({success: true, data: bootcamp} );  
}
)
/**
 * @desc Delete bootcamp
 * @route DELETE api/v1/bootcamps/:id
 * @access private
 */
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);
    if( !bootcamp) {
        return  next(new ErrorResponse(`Bootcamp not found with id of${req.params.id}`, 404));
    }
     // make sure user is bootcamp owner
     if( bootcamp.user.toString() !== req.user.id && req.user.role !=='admin') {
        return  next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this course`, 401));
    } 
    bootcamp.remove();
    res.status(200).json({success: true, data: {}} );
}
)
/**
 * @desc Get bootcamps within a radius
 * @route GET api/v1/bootcamps/radius/:zipcode/:distance
 * @access private
 */
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
    const {zipcode, distance} = req.params;
    // get lat-lan from geocoder
    const loc = await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;

    // calculate radius using radians
    // divide distance by radius of earth
    // Earth radius = 6378.1 km / 3963miles
    const radius = distance/3963;

    const bootcamps = await Bootcamp.find({
        location: { $geoWithin: { $centerSphere: [ [ lng, lat], radius]} }
    })

    res.status(200).json({
        success: true,
        count: bootcamps.length,
        data: bootcamps
    })
}
)

/**
 * @desc Upload bootcamp photo
 * @route PUT api/v1/bootcamps/:id/photo
 * @access private
 */
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);
    if( !bootcamp) {
        return  next(new ErrorResponse(`Bootcamp not found with id of${req.params.id}`, 404));
    }
     // make sure user is bootcamp owner
     if( bootcamp.user.toString() !== req.user.id && req.user.role !=='admin') {
        return  next(new ErrorResponse(`User ${req.user.id} is not authorized to upload photot for this course`, 401));
    } 
    if(!req.files) {
        return  next(new ErrorResponse(`Please upload a file`, 400));
    }
    const file = req.files.file;
    // check file is image
    if(!file.mimetype.startsWith('image')) {
        return  next(new ErrorResponse(`Please upload an image file`, 400));
    }
    // check image size
    if(file.size > process.env.MAX_FILE_UPLOAD) {
        return  next(new ErrorResponse(
            `Please upload image less than ${process.env.MAX_FILE_UPLOAD} Bytes`, 400));
    }
    // create custom file name
    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
        if(err) {
            console.log(err);
            return  next(new ErrorResponse(`File upload error`, 500));
        }
        await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name});
        
        res.status(200).json({success: true, data: file.name});
    });

}
)