const mongoose = require("mongoose");
const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, "Please add title"],
  },
  description: {
    type: String,
    required: [true, "Please add description"],
  },
  weeks: {
    type: String,
    required: [true, "Please add weeks"],
  },
  tuition: {
    type: Number,
    required: [true, "Please add tution cost."],
  },
  minimumSkill: {
    type: String,
    required: [true, "Please add minimum skills"],
    enum: ["beginner", "intermediate", "advanced"],
  },
  scholarshipAvailable: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: "Bootcamp",
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
});
// static method to get average of course tuition
CourseSchema.statics.getAverageCost = async function (bootcampId) {
  const obj = await this.aggregate([
    {
      $match: { bootcamp: bootcampId },
    },
    {
      $group: {
        _id: "$bootcamp",
        averageCost: { $avg: "$tuition" },
      },
    },
  ]);

  try {
    await this.model("Bootcamp").findByIdAndUpdate(bootcampId, {
      averageCost: Math.ceil(obj[0].averageCost / 10) * 10,
    });
  } catch (error) {
    console.log(error);
  }
};

// call averageCost after save
CourseSchema.post("save", async function () {
  this.constructor.getAverageCost(this.bootcamp);
});
// call averageCost before remove
CourseSchema.pre("remove", async function () {
  this.constructor.getAverageCost(this.bootcamp);
});

module.exports = mongoose.model("Course", CourseSchema);
