const mongoose = require('mongoose');


const noteSchema = new mongoose.Schema({
  noteName: {
    type: String,
    required: true,
    unique: true,  // Ensure note name is unique
  },
  noteDisplayName: {
    type: String,
    required: true,
  },
  isDownload: {
    type: Boolean,
    default: true,  // Set default value to true
  },
  fileUrl: {
    type: String,
    required: false,
    // validate: {
    //   validator: function (v) {
    //     return /^(ftp|http|https):\/\/[^ "]+$/.test(v);  // Validate URL format
    //   },
    //   message: "Invalid file URL format",
    // },
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',  // Reference to the Subject model
    required: false,
  }],
}, { timestamps: true });


module.exports = mongoose.model('Note', noteSchema);;
