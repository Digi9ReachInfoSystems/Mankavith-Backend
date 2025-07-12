const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  coupon_name: {
    type: String,
    required: [true, "Coupon name is required"],
    trim: true,
  },

  coupon_des: {
    type: String,
    required: [true, "Coupon description is required"],
    trim: true,
  },

  start_date: {
    type: Date,
    required: [true, "Start date is required"],
    validate: {
      validator: function (value) {
        return value instanceof Date && !isNaN(value);
      },
      message: "Start date must be a valid date",
    },
    default: Date.now,
  },

  end_date: {
    type: Date,
    required: [true, "End date is required"],
    validate: {
      validator: function (value) {
        return value instanceof Date && !isNaN(value);
      },
      message: "End date must be a valid date",
    },
  },



  discount_amount: {
    type: Number,
    required: [true, "Discount percentage is required"],
    min: [0, "Discount amount must be greater than or equal to 0"],
    // max: [100, "Discount percentage must be less than or equal to 100"],
  },

  coupon_image: {
    type: String,
    required: [true, "Coupon image is required"],
    validate: {
      validator: function (v) {
        return /^(ftp|http|https):\/\/[^ "]+$/.test(v);// Ensure valid image URL
      },
      message: "Coupon image must be a valid URL ",
    },
  },

  coupon_type: {
    type: String,
    required: [true, "Coupon type is required"],
    enum: {
      values: ["All", "Selected users"],
      message:
        'Coupon type must be either "All", "Selected users", ',
    },
  },

  user_list: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    required: function () {
      if (this.coupon_type === "Selected users" || this.coupon_type === "individual") {
        return true
      } else {
        return false
      }
      // Only required for "Selected users" or "individual"
    },
    validate: {
      validator:
        async function (value) {

          if (this.coupon_type === "Selected users") {
            console.log("jbj", value,)
            if (value.length > 0) {
              const userExists = await mongoose
                .model("User")
                .exists({ _id: { $in: value } });

              return userExists;
            }
            return false;
          } else {
            return true;
          }
        },

      message: "User list must contain valid user references",
    },
  },
  coupon_code: {
    type: String,
    required: [true, "Coupon code is required"],
    // validate: [
    //   //   {
    //   //     validator: function (value) {
    //   //       return /^[A-Za-z0-9]{5}$/.test(value);
    //   //     },
    //   //     message: "Coupon code must be a 5-character alphanumeric string"
    //   //   },
    //   // {
    //   //   validator: async function (value) {
    //   //     const coupon = await mongoose.model("Coupon").findOne({ coupon_code: value });
    //   //     return !coupon;
    //   //   },
    //   //   message: "Coupon code already exists"
    //   // }
    // ],
  },
  created_time: {
    type: Date,
    required: true,
    default: Date.now,
  },
  applied_users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",

  }],
  is_active: {
    type: Boolean,
    default: false,
  },
});

// Create and export the Coupon model
module.exports = mongoose.model("Coupon", couponSchema);