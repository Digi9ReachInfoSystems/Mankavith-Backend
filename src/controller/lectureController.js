const mongoose = require("mongoose");
const Lecture = require("../model/lecturesModel");
const Course = require("../model/course_model");
const Subject = require("../model/subject_model");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");

// const { uploadToCloudflareStream } = require("../utils/cloudflareStream");
// const path = require("path");
// const fs = require("fs-extra");
// const { convertToHls } = require("../utils/convertToHls");
const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
// @desc    Create a new Lecture
// @route   POST /lecture
// @access  Private/Admin
exports.createLecture = async (req, res) => {
  try {
    // const { lectureName, description, duration, videoUrl, subjectRef, folder } = req.body;
    const { lectureName, description, duration, subjectRef, folder } = req.body;
    // console.log(req.body);
    const file = req.file;
    // console.log("api called file upload", req.videoUrl);
// console.log(" req.file    ",subjectRef);
    const timestamp = Date.now();
    let url = '';
    // const response = await Promise.all(uploadPromises);
    const params = {
      Bucket: BUCKET_NAME,
      Key: `${folder}/${timestamp}${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };
    const command = new PutObjectCommand(params);
    const response = await s3.send(command);
    if (response.$metadata.httpStatusCode == 200) {

      url: `${folder}/${timestamp}${file.originalname}`

    } else {
      res.status(500).send({ error: response });
    }
    // Validate required fields
    // if (!lectureName || !duration || !videoUrl) {
    //   return res.status(400).json({ success: false, message: "lectureName, duration and videoUrl are required" });
    // }
    if (!lectureName) {
      return res.status(400).json({ success: false, message: "lectureName is required" });
    }

    // Optional: Validate courseRef and subjectRef
    // if (courseRef && !mongoose.Types.ObjectId.isValid(courseRef)) {
    //   return res.status(400).json({ success: false, message: "Invalid courseRef" });
    // }

    // if (subjectRef && !mongoose.Types.ObjectId.isValid(subjectRef)) {
    //   return res.status(400).json({ success: false, message: "Invalid subjectRef" });
    // }
    let subjects = [];
    if (subjectRef) {
      subjects = subjectRef.split(',');
    }
    const lecture = new Lecture({ lectureName, description, duration, videoUrl: `${folder}/${timestamp}${file.originalname}`, subjectRef: subjects, folder });
    const savedLecture = await lecture.save();
    if (subjects && subjects.length > 0) {
      subjects.forEach(async (subjectId) => {
        const subject = await Subject.findById(subjectId);
        if (subject) {
          subject.lectures.push(savedLecture._id);
          await subject.save();
        }
      })
    }


    return res.status(201).json({ success: true, data: savedLecture });
  } catch (error) {
    console.error("Error creating lecture:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};



// exports.createLecture = async (req, res) => {
//   try {
//     const { lectureName, description, duration, subjectRef } = req.body;
//     const file = req.file;

//     if (!file) {
//       return res.status(400).json({ success: false, message: "Video file required" });
//     }

//     if (!lectureName) {
//       return res.status(400).json({ success: false, message: "lectureName required" });
//     }

//     // 🔥 Upload MP4 → Cloudflare Stream
//     const stream = await uploadToCloudflareStream(
//       file.buffer,
//       file.originalname
//     );

//     const subjects = subjectRef ? subjectRef.split(",") : [];

//     const lecture = new Lecture({
//       lectureName,
//       description,
//       duration,
//       subjectRef: subjects,
//       videoUrl: stream.hlsUrl,          // 👈 HLS URL ONLY
//       streamId: stream.streamId,
//       videoType: "HLS",
//       thumbnail: stream.thumbnail,
//     });

//     const savedLecture = await lecture.save();

//     if (subjects.length) {
//       await Subject.updateMany(
//         { _id: { $in: subjects } },
//         { $push: { lectures: savedLecture._id } }
//       );
//     }

//     res.status(201).json({ success: true, data: savedLecture });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// exports.createLecture = async (req, res) => {
//   try {
//     const { lectureName, description, duration, subjectRef, folder } = req.body;
//     const file = req.file;

//     if (!lectureName) {
//       return res.status(400).json({ success: false, message: "lectureName is required" });
//     }

//     if (!file) {
//       return res.status(400).json({ success: false, message: "Video file is required" });
//     }

//     const timestamp = Date.now();

//     /* -----------------------------
//        1. Save MP4 temporarily
//     ------------------------------ */
//     const tmpDir = path.join(__dirname, "../tmp");
//     await fs.ensureDir(tmpDir);

//     const mp4Path = path.join(tmpDir, `${timestamp}-${file.originalname}`);
//     await fs.writeFile(mp4Path, file.buffer);

//     /* -----------------------------
//        2. Convert MP4 → HLS
//     ------------------------------ */
//    const { outputDir: hlsOutputDir, playlistPath } = await convertToHls(mp4Path);


//     /* -----------------------------
//        3. Upload HLS files to S3
//     ------------------------------ */
//     const hlsFiles = await fs.readdir(hlsOutputDir);

//     for (const fileName of hlsFiles) {
//       const filePath = path.join(hlsOutputDir, fileName);
//       const fileBuffer = await fs.readFile(filePath);

//       const uploadParams = {
//         Bucket: BUCKET_NAME,
//         Key: `${folder}/${timestamp}/${fileName}`,
//         Body: fileBuffer,
//         ContentType: fileName.endsWith(".m3u8")
//           ? "application/vnd.apple.mpegurl"
//           : "video/mp2t",
//       };

//       await s3.send(new PutObjectCommand(uploadParams));
//     }

//     /* -----------------------------
//        4. Cleanup temp files
//     ------------------------------ */
//     await fs.remove(mp4Path);
//     await fs.remove(hlsOutputDir);

//     /* -----------------------------
//        5. Save lecture in DB
//     ------------------------------ */
//     const subjects = subjectRef ? subjectRef.split(",") : [];

//     const lecture = new Lecture({
//       lectureName,
//       description,
//       duration,
//       videoUrl: `${folder}/${timestamp}/index.m3u8`, // ✅ STORE HLS
//       subjectRef: subjects,
//       folder,
//     });

//     const savedLecture = await lecture.save();

//     if (subjects.length > 0) {
//       for (const subjectId of subjects) {
//         const subject = await Subject.findById(subjectId);
//         if (subject) {
//           subject.lectures.push(savedLecture._id);
//           await subject.save();
//         }
//       }
//     }

//     return res.status(201).json({ success: true, data: savedLecture });
//   } catch (error) {
//     console.error("Error creating lecture:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };





// @desc    Get all Lectures
// @route   GET /lecture
// @access  Public
exports.getAllLectures = async (req, res) => {
  try {
    const lectures = await Lecture.find()
      // .populate("courseRef", "courseName")
      // .populate("subjectRef", "subjectName")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: lectures.length, data: lectures });
  } catch (error) {
    console.error("Error fetching lectures:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// @desc    Get single Lecture by ID
// @route   GET /lecture/:id
// @access  Public
exports.getLectureById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid lecture ID" });
    }

    const lecture = await Lecture.findById(id)
    // .populate("courseRef", "courseName")
    // .populate("subjectRef", "subjectName");

    if (!lecture) {
      return res.status(404).json({ success: false, message: "Lecture not found" });
    }

    res.status(200).json({ success: true, data: lecture });
  } catch (error) {
    console.error("Error fetching lecture:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// @desc    Update Lecture
// @route   PUT /lecture/:id
// @access  Private/Admin
exports.updateLecture = async (req, res) => {
  try {
    const { id } = req.params;
    const { lectureName, description, duration, videoUrl, subjectRef, folder } = req.body;
    const file = req.file;
    // console.log("api called file upload", req.videoUrl);
    
    const timestamp = Date.now();
     let url = '';
     console.log(" req.file    ",req.file);
     if(req.file){
   
    // const response = await Promise.all(uploadPromises);
    const params = {
      Bucket: BUCKET_NAME,
      Key: `${folder}/${timestamp}${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };
    const command = new PutObjectCommand(params);
    const response = await s3.send(command);
    if (response.$metadata.httpStatusCode == 200) {

      url: `${folder}/${timestamp}${file.originalname}`

    } else {
      res.status(500).send({ error: response });
    }
   
      url = `${folder}/${timestamp}${file.originalname}`;
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid lecture ID" });
    }
    const lecture = await Lecture.findById(id);
    if (!lecture) {
      return res.status(404).json({ success: false, message: "Lecture not found" });
    }
    lecture.subjectRef.forEach(async (subjectId) => {
      const subject = await Subject.findById(subjectId);
      if (subject) {
        subject.lectures.pull(id);
        await subject.save();
      }
    })
    let subjects = [];
    if (subjectRef) {
      subjects = subjectRef.split(',');
    }
    subjects.forEach(async (subjectId) => {
      const subject = await Subject.findById(subjectId);
      if (subject) {
        subject.lectures.push(id);
        await subject.save();
      }
    })
    console.log(" subjects", subjects);

    const updatedLecture = await Lecture.findByIdAndUpdate(
      id,
      { lectureName, description, duration, videoUrl:url!=``?url:lecture.videoUrl, subjectRef: subjects, folder },
      { new: true, runValidators: true }
    )
    // .populate("courseRef", "courseName")
    // .populate("subjectRef", "subjectName");

    if (!updatedLecture) {
      return res.status(404).json({ success: false, message: "Lecture not found" });
    }

    res.status(200).json({ success: true, data: updatedLecture });
  } catch (error) {
    console.error("Error updating lecture:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// @desc    Delete Lecture
// @route   DELETE /lecture/:id
// @access  Private/Admin
exports.deleteLecture = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid lecture ID" });
    }
    const lecture = await Lecture.findById(id);
    if (!lecture) {
      return res.status(404).json({ success: false, message: "Lecture not found" });
    }
    // Remove lecture from associated subjects
    await Promise.all(
      lecture.subjectRef.map(async (subjectId) => {
        const subject = await Subject.findById(subjectId);
        if (subject) {
          subject.lectures.pull(id);
          await subject.save();
        } else {
          return;
        }
      })
    );
    const deletedLecture = await Lecture.findByIdAndDelete(id);

    if (!deletedLecture) {
      return res.status(404).json({ success: false, message: "Lecture not found" });
    }

    res.status(200).json({ success: true, message: "Lecture deleted successfully" });
  } catch (error) {
    console.error("Error deleting lecture:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};
exports.bulkDeleteLectures = async (req, res) => {
  try {
    const { lectureIds } = req.body;
    if (lectureIds.length === 0) {
      return res.status(400).json({ success: false, message: "No lecture IDs provided" });
    }

    let results = [];
    for (const id of lectureIds) {
      try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ success: false, message: "Invalid lecture ID" });
        }
        const lecture = await Lecture.findById(id);
        if (!lecture) {
          results.push({ id, success: false, message: "Lecture not found" });
          continue; // Skip to the next ID if lecture not found
        }
        // Remove lecture from associated subjects
        await Promise.all(
          lecture.subjectRef.map(async (subjectId) => {
            const subject = await Subject.findById(subjectId);
            if (subject) {
              subject.lectures.pull(id);
              await subject.save();
            } else {
              return;
            }
          })
        );
        const deletedLecture = await Lecture.findByIdAndDelete(id);

        if (!deletedLecture) {
          results.push({ id, success: false, message: "Lecture not found" });
          continue; // Skip to the next ID if lecture not found
        }

        results.push({ id, success: true, message: "Lecture deleted successfully", data: deletedLecture });

      } catch (error) {
        console.error("Error processing lecture ID:", id, error);
        results.push({ id, success: false, message: "Error processing lecture", error: error.message });
      }
    }

    return res.status(200).json({ success: true, message: "Bulk delete operation completed", results });
  } catch (error) {
    console.error("Error deleting lecture:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};




module.exports.rearrangeLectures = async (req, res) => {
  try {
    const { lectureIds } = req.body;

    // Validation
    if (!lectureIds || !Array.isArray(lectureIds) || lectureIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of lecture IDs in the desired order"
      });
    }

    // Convert and validate ObjectIds
    const objectIds = lectureIds.map(id => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (error) {
        return null;
      }
    });

    if (objectIds.some(id => !id)) {
      return res.status(400).json({
        success: false,
        message: "One or more lecture IDs are invalid",
        invalidIds: lectureIds.filter((_, index) => !objectIds[index])
      });
    }

    // Create bulk operations
    const bulkOps = objectIds.map((lectureId, index) => ({
      updateOne: {
        filter: { _id: lectureId },
        update: { $set: { order: index + 1 } } // 1-based indexing
      }
    }));

    // Execute bulk write
    const result = await mongoose.model('Lecture').bulkWrite(bulkOps);

    // Check if all lectures were found
    if (result.matchedCount !== lectureIds.length) {
      return res.status(404).json({
        success: false,
        message: 'Some lectures could not be found',
        found: result.matchedCount,
        requested: lectureIds.length,
        missing: lectureIds.length - result.matchedCount
      });
    }

    // Successful response
    res.status(200).json({
      success: true,
      message: 'Lectures reordered successfully',
      data: {
        updatedCount: result.modifiedCount,
        newOrder: lectureIds.map((id, index) => ({
          lectureId: id,
          position: index + 1
        }))
      }
    });

  } catch (error) {
    console.error('Error reordering lectures:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while reordering lectures',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};