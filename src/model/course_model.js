const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    courseName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    category: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: false
    }],
    scheduled_class: {
      type: Map,
      of: String, // Can store schedule details as key-value pairs
      default: {}
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "draft"],
      default: "draft",
    },
    courseDisplayName: {
      type: String,
      required: false,
      trim: true
    },
    shortDescription: {
      type: String,
      required: false,
      // maxlength: 160 // Good for SEO meta descriptions
    },
    description: {
      type: String,
      required: false,
    },
    price: {
      type: Number,
      required: false,
      min: 0
    },
    duration: {
      type: Number,
      required: false,
    },
    no_of_videos: {
      type: Number,
      required: false,
      default: 0,
      min: 0
    },
    no_of_subjects: {
      type: Number,
      required: false,
      default: 0,
      min: 0
    },
    no_of_notes: {
      type: Number,
      required: false,
      default: 0,
      min: 0
    },
    successRate: {
      type: Number,
      required: false,
      min: 0,
      max: 100
    },
    course_includes: [{
      type: String,
      trim: false
    }],
    course_rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: v => Math.round(v * 100) / 100 // Round to 2 decimal places
    },
    student_feedback: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Feedback",
      required: false
    }],
    discountPrice: {
      type: Number,
      required: false,
      min: 0,
      validate: {
        validator: function (v) {
          return v <= this.price;
        },
        message: "Discount price cannot be greater than regular price"
      }
    },
    live_class: {
      type: Boolean,
      default: false,
    },
    recorded_class: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    student_enrolled: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    discountActive: {
      type: Boolean,
      default: false,
    },
    subjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: false,
    }],
    mockTests: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "MockTest",
      required: false
    }],
    image: {
      type: String,
      required: false,
      // validate: {
      //   validator: v => /^(http|https):\/\/[^ "]+$/.test(v),
      //   message: "Invalid image URL format"
      // }
    },
    isKycRequired: {
      type: Boolean,
      default: false,
    },
    instructors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }],
    prerequisites: [{
      type: String,
      trim: true
    }],
    language: {
      type: String,
      default: "English",
      enum: ["English", "Hindi", "Spanish", "French"] // Add more as needed
    },
    certificate_available: {
      type: Boolean,
      default: false
    },
    recorded_sessions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecordedSession"
    }],
    courseExpiry: {
      type: Date,
      required: false
    },
    course_order: {
      type: Number,
      required: true,
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for discount percentage
courseSchema.virtual('discountPercentage').get(function () {
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

// Calculate average rating
courseSchema.methods.calculateAverageRating = async function () {
  const feedbacks = await mongoose.model('Feedback').find({
    _id: { $in: this.student_feedback },
    isappproved: true
  });
  if (feedbacks.length === 0) {
    this.rating = 0;
    this.course_rating = 0;
  } else {
    const total = feedbacks.reduce((sum, fb) => sum + fb.rating, 0);
    const avg = total / feedbacks.length;
    this.rating = avg.toFixed(1);
    this.course_rating = avg.toFixed(1);
  }
};

// Update counts before saving
courseSchema.pre("save", async function (next) {
  try {
    // Calculate rating if feedback was modified
    if (this.isModified('student_feedback')) {
      await this.calculateAverageRating();
    }

    // Update subject count
    this.no_of_subjects = this.subjects?.length || 0;

    // Update enrolled students count
    this.student_enrolled_count = this.student_enrolled?.length || 0;

    // Count notes across all subjects
    if (this.subjects?.length > 0) {
      const subjects = await mongoose.model('Subject').find({
        _id: { $in: this.subjects }
      }).select('notes');

      this.no_of_notes = subjects.reduce(
        (sum, subject) => sum + (subject.notes?.length || 0), 0
      );
    } else {
      this.no_of_notes = 0;
    }
    if (this.subjects?.length > 0) {
      const subjects = await mongoose.model('Subject').find({
        _id: { $in: this.subjects }
      }).select('lectures');

      this.no_of_videos = subjects.reduce(
        (sum, subject) => sum + (subject.lectures?.length || 0), 0
      );
    } else {
      this.no_of_videos = 0;
    }

    next();
  } catch (err) {
    next(err);
  }
});

// Update course rating when feedback is modified
courseSchema.post('findOneAndUpdate', async function (doc) {
  if (doc && (doc.student_feedback || this.getUpdate()?.student_feedback)) {
    await doc.calculateAverageRating();
    await doc.save();
  }
});

// Indexes for better performance
// courseSchema.index({ courseName: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ rating: -1 });
courseSchema.index({ price: 1 });
courseSchema.index({ isPublished: 1, status: 1 });

module.exports = mongoose.model("Course", courseSchema);