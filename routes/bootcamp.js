const express = require('express');
const {getBootcamp, getBootcamps, createBootcamp, bootcampPhotoUpload,
    updateBootcamp, deleteBootcamp, getBootcampsInRadius} = require('../controllers/bootcamps');

const Bootcamp = require('../models/Bootcamp');
const advanvedResults = require('../middleware/advancedResult');

// include other resource routers
const coursesRouter = require('./courses');
    
const router = express.Router();

const {protect, authorize} = require('../middleware/auth');


// re-route into other resource router
router.use('/:bootcampId/courses', coursesRouter);

router.route('/:id/photo')
.put(protect, authorize('publisher', 'admin'), bootcampPhotoUpload);

router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius);

router.route('/')
.get(advanvedResults(Bootcamp, 'courses'), getBootcamps)
.post(protect, authorize('publisher', 'admin'), createBootcamp);

router.route('/:id').get(getBootcamp)
.put(protect, authorize('publisher', 'admin'), updateBootcamp)
.delete(protect, authorize('publisher', 'admin'), deleteBootcamp);

module.exports = router;