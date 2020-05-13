const mongoose = require('mongoose');
const slugify = require('slugify');
const geocoder = require('../utils/geocoder');

const BootcampSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add name.'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters.']
    },
    slug: String,
    description: {
        type: String,
        required: [true, 'Please add description'],
        trim: true,
        maxlength: [500, 'Description can not be more than 500']
    },
    website: {
        type: String,
        match: [/^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/
        , 'Please add valid url']
    },
    phone: {
        type: String,
        maxlength: [20, 'Phone number can not be more than 20 characters']
    },
    email: {
        type: String,
        match: [/^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i, 'Please enter valid email']
    },
    address: {
        type: String,
        required:[true, 'Please add an address.']
    },
    location: {
        // GeoJSON point
        type: {
            type: String,
            enum: ['Point'],
            required: false
        },
        coordinates: {
            type: [Number],
            required: false,
            index: '2dsphere'
        },
        formattedAddress: String,
        street: String,
        city: String,
        state: String,
        zipcode: String,
        country: String
    },
    careers: {
        type: [String],
        required: true,
        enum: [
            'Web Development',
            'Mobile Development',
            'UI/UX',
            'Data Science',
            'Business',
            'Others'
        ]
    },
    averageRating: {
        type: Number,
        min: [1, 'Rating must be atleast 1'],
        max: [10, 'Rating can not be more than 10']
    },
    averageCost: Number,
    photo: {
        type: String,
        default: 'no-photo.jpg'
    },
    housing: {
        type: Boolean,
        default: false
    },
    jobAssistance: {
        type: Boolean,
        default: false
    },
    jobGuarantee: {
        type: Boolean,
        default: false
    },
    acceptGi: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
}, {
   toJSON: { virtuals: true},
   toObject: { virtuals: true} 
})

// Create bootcamp slug from name
BootcampSchema.pre('save', function(next){
    this.slug = slugify(this.name, { lower: true});     
    next();
})
// Geocode and create location field
BootcampSchema.pre('save', async function(next){
    const loc = await geocoder.geocode(this.address);
    this.location = {
        type: 'Point',
        coordinates: [loc[0].longitude, loc[0].latitude],
        formattedAddress: loc[0].formattedAddress,
        street: loc[0].streetName,
        city: loc[0].city,
        state: loc[0].state,
        zipcode: loc[0].zipcode,
        country: loc[0].country
    }
    // do not save address in db
    this.address = undefined;
    next();
})
// cascade delete courses when a bootcamp is deleted
BootcampSchema.pre('remove', async function(next){
    await this.model('Course').deleteMany({bootcamp: this._id});
    next();
})

// reverse populate with virtuals
BootcampSchema.virtual('courses', {
    ref: 'Course',
    localField: '_id',
    foreignField: 'bootcamp',
    justOne: false
})

module.exports = mongoose.model('Bootcamp', BootcampSchema);