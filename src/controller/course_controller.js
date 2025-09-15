const Course = require("../model/course_model");
const Category = require("../model/category_model");
const Subject = require("../model/subject_model");
const User = require("../model/user_model");
const UserProgress = require("../model/userProgressModel");
const Feedback = require("../model/feedback");
const RecordedSession = require("../model/recorded_sessionModel");
const CourseProgress = require("../model/courseProgressModel");
const Meeting = require("../model/meetingsModel");
const Payment = require("../model/paymentModel");
const Certificate = require("../model/certificatesModel");
// Create a new course (updated for category reference)
exports.createCourse = async (req, res) => {
  try {
    let courseData = req.body;

    // Validate category if provided
    if (courseData.category.length > 0) {

      courseData.category = await Promise.all(courseData.category.map(async (cat) => {
        const categoryExists = await Category.findById(cat);
        if (!categoryExists) {
          return null;
        }
        return cat;
      }));
      courseData.category =  courseData.category.filter(cat => cat !== null);

      // const categoryExists = await Category.findById(courseData.category);
      // if (!categoryExists) {
      //   return res.status(400).json({
      //     success: false,
      //     message: "Category not found",
      //   });
      // }
    }

    // Check if course with this name already exists
    const existingCourse = await Course.findOne({
      courseName: courseData.courseName,
    });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: "Course with this name already exists.",
      });
    }


    const newCourse = new Course({
      ...courseData,
      category: courseData.category || null, // Default to null if not provided
    });


    const savedCourse = await newCourse.save();
    if (courseData.subjects.length > 0) {
      for (let i = 0; i < courseData.subjects.length; i++) {
        const subject = await Subject.findById(courseData.subjects[i]);
        if (subject) {
          if (subject.courses.includes(savedCourse._id)) {
            continue;
          }
          subject.courses.push(savedCourse._id);
          await subject.save();
        }

      }
    }

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: savedCourse,
    });
  } catch (error) {
    console.error("Error creating course:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not create course.",
      error: error.message,
    });
  }
};

// Search courses by name and filter by category (updated)
exports.searchCourses = async (req, res) => {
  try {
    const { name, category } = req.query;
    let query = {};
    query.isPublished = true; // Only fetch published courses
    // query.courseExpiry = { $gte: new Date() }; // Only fetch courses that are not expired
    // Add name filter if provided (case-insensitive search)
    if (name) {
      query.courseName = { $regex: name, $options: "i" };
    }

    // Add category filter if provided
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: "Category not found",
        });
      }
      query.category = category;
    }

    const courses = await Course.find(query)
      .populate("subjects",)
      .populate("category",)
      .populate("student_feedback")
      .populate("student_enrolled")
      .populate("mockTests")
      .populate("recorded_sessions")
      .sort({ courseName: 1 });

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.error("Error searching courses:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not search courses.",
      error: error.message,
    });
  }
};

// Get all courses - updated to filter by category if provided
exports.getAllCourses = async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    query.isPublished = true; // Only fetch published courses
    // query.courseExpiry = { $gte: new Date() }; // Only fetch courses that are not expired
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: "Category not found",
        });
      }
      query.category = category;
    }

    const courses = await Course.find(query)
      .populate({
        path: "subjects",
        select: "subjectName image description lectures notes",
        populate: [
          {
            path: "lectures",
            // select: "_id"
          },
          {
            path: "notes",
            // select: "_id"
          },
          {
            path: "mockTests",
            // select: "_id"

          }

        ]
      })
      .populate("category",)
      .populate("student_feedback")
      .populate("student_enrolled")
      .populate("mockTests")
      .populate("recorded_sessions")

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.error("Error fetching courses:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch courses.",
      error: error.message,
    });
  }
};

// Get courses by category (updated)
exports.getCoursesByCategory = async (req, res) => {
  try {
    const { categoryName } = req.params;


    // Check if category exists in database
    const category = await Category.findOne({ title: categoryName });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Find courses that reference this category
    const courses = await Course.find({ category: category._id, isPublished: true })
      .populate("subjects",)
      .populate("category",)
      .populate("student_feedback")
      .populate("student_enrolled")
      .populate("mockTests")
      .populate("recorded_sessions")

    return res.status(200).json({
      success: true,
      count: courses.length,
      category: category.title,
      data: courses,
    });
  } catch (error) {
    console.error("Error fetching courses by category:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch courses by category.",
      error: error.message,
    });
  }
};

// Update course by ID (updated for category reference)
exports.updateCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    let updateData = req.body;

    // Validate category if provided in update
    if (updateData.category.length > 0) {
      updateData.category = await Promise.all(updateData.category.map(async (cat) => {
        const categoryExists = await Category.findById(cat);
        if (!categoryExists) {
          return null;
        }
        return cat;
      }));
      updateData.category = updateData.category.filter(cat => cat !== null);
      // const categoryExists = await Category.findById(updateData.category);
      // if (!categoryExists) {
      //   return res.status(400).json({
      //     success: false,
      //     message: "Category not found",
      //   });
      // }
    }
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }
    course.courseName = updateData.courseName ?? course.courseName;
    course.courseDisplayName = updateData.courseDisplayName ?? course.courseDisplayName;
    course.shortDescription = updateData.shortDescription ?? course.shortDescription;
    course.description = updateData.description ?? course.description;
    course.duration = updateData.duration ?? course.duration;
    course.status = updateData.status ?? course.status;
    course.language = updateData.language ?? course.language;
    course.certificate_available = updateData.certificate_available ?? course.certificate_available;

    course.category = updateData.category ?? course.category;

    if (updateData.price != null) {
      course.price = Number(updateData.price);
    }
    if (updateData.discountPrice != null) {
      course.discountPrice = Number(updateData.discountPrice);
    }
    course.discountActive = updateData.discountActive ?? course.discountActive;

    course.live_class = updateData.live_class ?? course.live_class;
    course.recorded_class = updateData.recorded_class ?? course.recorded_class;
    course.isPublished = updateData.isPublished ?? course.isPublished;
    course.isKycRequired = updateData.isKycRequired ?? course.isKycRequired;

    if (Array.isArray(updateData.course_includes)) {
      course.course_includes = updateData.course_includes;
    }

    if (updateData.scheduled_class != null) {
      course.scheduled_class = updateData.scheduled_class;
    }

    if (Array.isArray(updateData.subjects)) {
      course.subjects = updateData.subjects;
    }

    if (Array.isArray(updateData.mockTests)) {
      course.mockTests = updateData.mockTests;
    }

    if (Array.isArray(updateData.student_feedback)) {
      course.student_feedback = updateData.student_feedback;
    }

    if (Array.isArray(updateData.student_enrolled)) {
      course.student_enrolled = updateData.student_enrolled;
    }

    if (Array.isArray(updateData.instructors)) {
      course.instructors = updateData.instructors;
    }

    if (Array.isArray(updateData.prerequisites)) {
      course.prerequisites = updateData.prerequisites;
    }

    if (updateData.no_of_videos != null) {
      course.no_of_videos = Number(updateData.no_of_videos);
    }
    if (updateData.successRate != null) {
      course.successRate = Number(updateData.successRate);
    }

    if (updateData.course_rating != null) {
      course.course_rating = Number(updateData.course_rating);
    }
    if (updateData.rating != null) {
      course.rating = Number(updateData.rating);
    }

    course.image = updateData.image ?? course.image;
    if(updateData.courseExpiry != null) {
      course.courseExpiry = updateData.courseExpiry;
    }

    const updatedCourse = await course.save();
    // const updatedCourse = await Course.findByIdAndUpdate(courseId, updateData, {
    //   new: true,
    //   runValidators: true,
    // })
    //   .populate("subjects", "subjectName")
    //   .populate("category", "title");

    if (!updatedCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Error updating course:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not update course.",
      error: error.message,
    });
  }
};

// Publish course (updated to populate category)
exports.publishCourse = async (req, res) => {
  try {
    const courseId = req.params.id;

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { isPublished: true },
      { new: true }
    )
      .populate("subjects", "subjectName")
      .populate("category", "title");

    if (!updatedCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course published successfully",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Error publishing course:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not publish course.",
      error: error.message,
    });
  }
};

// Get course by ID (updated to populate category)

exports.getCourseById = async (req, res) => {
  try {
    const courseId = req.params.id;

    const course = await Course.findOne({ _id: courseId })
      .populate({
        path: "subjects",
        select: "subjectName image description lectures notes",
        populate: [
          {
            path: "lectures",
            // select: "_id"
          },
          {
            path: "notes",
            // select: "_id"
          }
        ]
      })
      .populate("category")
      .populate("student_feedback")
      .populate("recorded_sessions")

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const courseObj = course.toObject();

    // 🧮 Initialize counts
    let totalLectures = 0;
    let totalNotes = 0;

    // 📊 Count subjects and iterate for lectures + notes
    courseObj.no_of_subjects = courseObj.subjects?.length || 0;

    courseObj.subjects = courseObj.subjects.map(subject => {
      const lectureCount = subject.lectures?.length || 0;
      const noteCount = subject.notes?.length || 0;

      totalLectures += lectureCount;
      totalNotes += noteCount;

      return {
        ...subject,
        no_of_lectures: lectureCount
        // optionally: no_of_notes: noteCount
      };
    });

    courseObj.no_of_videos = totalLectures;
    courseObj.no_of_notes = totalNotes;

    return res.status(200).json({
      success: true,
      data: courseObj,
    });
  } catch (error) {
    console.error("Error fetching course by ID:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch course.",
      error: error.message,
    });
  }
};

// Delete course by ID
exports.deleteCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }
    await Promise.all(
      course.subjects.map(async (subjectId) => {
        const subject = await Subject.findById(subjectId);
        if (!subject) {
          return;
        }
        subject.courses.pull(courseId);
        await subject.save();

      }))
    await Promise.all(
      course.recorded_sessions.map(async (sessionId) => {
        const session = await RecordedSession.findById(sessionId);
        if (!session) {
          return;
        }
        session.courses.pull(courseId);
        await session.save();
      })
    )
    await Promise.all(
      course.student_feedback.map(async (feedbackId) => {
        const feedback = await Feedback.findByIdAndDelete(feedbackId);
      })
    )
    const courseProgress = await CourseProgress.findOneAndDelete({ course_id: courseId });

    const meeting = await Meeting.findOneAndDelete({ course_Ref: courseId });
    await Promise.all(
      course.student_enrolled.map(async (studentId) => {
        const student = await User.findById(studentId);
        const foundSubscription = student.subscription.find(sub => sub.course_enrolled.equals(courseId));
        if (!foundSubscription) {
          return;
        }
        const payment = await Payment.findByIdAndDelete(foundSubscription.payment_id);
        const certificate = await Certificate.findOneAndDelete({ course_ref: courseId, user_ref: studentId });
        const userProgress = await UserProgress.findOne({ user_ref: studentId });
        if (userProgress) {
          userProgress.courseProgress = userProgress.courseProgress.filter(progress => !progress.course_id.equals(courseId));
          await userProgress.save();
        }
        student.subscription = student.subscription.filter(sub => !sub.course_enrolled.equals(courseId));
        await student.save();
      })
    )

    const deletedCourse = await Course.findByIdAndDelete(courseId);

    if (!deletedCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
      data: deletedCourse,
    });
  } catch (error) {
    console.error("Error deleting course:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not delete course.",
      error: error.message,
    });
  }
};
exports.searchCourses = async (req, res) => {
  try {
    const { name, categoryName } = req.query;
    let query = {};
    query.isPublished = true; // Only fetch published courses

    if (name) query.courseDisplayName = { $regex: name, $options: "i" };
    if (categoryName != 'null') {
      const categoryExists = await Category.findOne({ title: categoryName });
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: "Category not found",
        });
      }
      query.category = categoryExists._id;
    }

    const courses = await Course.find(query)
      .populate("subjects")
      .populate("category");

    return res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error("Error searching courses:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not search courses.",
      error: error.message,
    });
  }
};

exports.addFeedbackToCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { student_ref, review, rating } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (!student_ref || !review || !rating) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    if (!(course.student_feedback.some(feedback => feedback.student_ref === student_ref))) {
      course.student_feedback.push({ student_ref, review, rating });
      await course.save();
    }

    return res.status(200).json({
      success: true,
      message: "Feedback added successfully",
    });
  } catch (error) {
    console.error("Error adding feedback:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not add feedback.",
      error: error.message,
    });
  }
};

exports.getNoOfCourses = async (req, res) => {
  try {
    const count = await Course.countDocuments({ isPublished: true });
    return res.status(200).json({
      success: true,
      count: count,  // Changed from 'data' to 'count' for clarity
    });
  } catch (error) {
    console.error("Error fetching number of courses:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch number of courses.",
      error: error.message,
    });
  }
};

exports.getAllUserCourses = async (req, res) => {
  try {
    const { user_id } = req.params;
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    let courses = await Course.find({ isPublished: true ,
      // courseExpiry: { $gte: new Date() }
    }).populate("subjects").populate("category");
    courses = courses.map(course => {
      if (user.subscription.find(sub => sub.course_enrolled.equals(course._id))) {
        return ({
          ...course._doc,
          isEnrolled: true
        })
      } else {
        return ({
          ...course._doc,
          isEnrolled: false
        })
      }
    });
    return res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error("Error fetching user courses:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch user courses.",
      error: error.message,
    });
  }
};
exports.getAllUserCoursesByCategory = async (req, res) => {
  try {
    const { user_id, category } = req.params;
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const categoryExists = await Category.findOne({ title: category });
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    let courses = await Course.find({ category: categoryExists._id, isPublished: true,
      //  courseExpiry: { $gte: new Date() } 
      }).populate("subjects").populate("category");
    courses = courses.map(course => {
      if (user.subscription.find(sub => sub.course_enrolled.equals(course._id))) {
        return ({
          ...course._doc,
          isEnrolled: true
        })
      } else {
        return ({
          ...course._doc,
          isEnrolled: false
        })
      }
    });
    return res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error("Error fetching user courses:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch user courses.",
      error: error.message,
    });
  }
};

exports.searchUserCourses = async (req, res) => {
  try {
    const { name } = req.query;
    const { user_id, categoryName } = req.params
    let query = {};
    query.isPublished = true; // Only fetch published courses
    // query.courseExpiry = { $gte: new Date() }; // Only fetch courses that are not expired
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }


    if (name) query.courseDisplayName = { $regex: name, $options: "i" };
    if (categoryName != 'null') {
      const categoryExists = await Category.findOne({ title: categoryName });
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: "Category not found",
        });
      }
      query.category = categoryExists._id;
    }


    let courses = await Course.find(query)
      .populate("subjects")
      .populate("category");

    courses = courses.map(course => {
      if (user.subscription.find(sub => sub.course_enrolled.equals(course._id))) {
        return ({
          ...course._doc,
          isEnrolled: true
        })
      } else {
        return ({
          ...course._doc,
          isEnrolled: false
        })
      }
    });

    return res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error("Error searching courses:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not search courses.",
      error: error.message,
    });
  }
};

exports.getCourseWithProgress = async (req, res) => {
  try {
    const { courseId, userId } = req.body;
    console.log("Fetching course with progress for user:", userId, "and course:", courseId);

    // Fetch course with nested subjects and lectures
    let course = await Course.findOne({ _id: courseId, isPublished: true})
      .populate({
        path: "subjects",
        populate: [{
          path: "lectures",
          // path :"notes"
        }],
      })
       .populate({
        path: "subjects",
        populate: [{
          // path: "lectures",
          path :"notes"
        }],
      });

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    // Fetch user progress for this course
    const userProgress = await UserProgress.findOne({ user_id: userId });
    console.log("User progress:", userProgress);
    if (!userProgress) {

      course = {
        ...course.toObject(),
        status: "not started",
        completedPercentage: 0,
        completed: false
      }
      course.subjects = course.subjects.map(subject => ({
        ...subject,
        status: "not started",
        completedPercentage: 0,
        completed: false,
        lectures: subject.lectures.map(lecture => ({
          ...lecture,
          status: "not started",
          completedPercentage: 0,
          completed: false,
        })),
      }));

      return res.status(200).json({ success: true, data: course });
    }

    // Initialize progress data
    let courseProgress = null;
    if (userProgress) {
      courseProgress = userProgress.courseProgress.find(p => p.course_id.toString() === courseId);

      if (!courseProgress) {
        course = {
          ...course.toObject(),
          viewedCertificate: courseProgress?.viewedCertificate || false,
          status: "not started",
          completedPercentage: 0,
          completed: false
        }
        course.subjects = course.subjects.map(subject => ({
          ...subject,
          status: "not started",
          completedPercentage: 0,
          completed: false,
          lectures: subject.lectures.map(lecture => ({
            ...lecture,
            status: "not started",
            completedPercentage: 0,
            completed: false,
          })),
        }));

        return res.status(200).json({ success: true, data: course });
      } else {
        if (courseProgress.status === "completed") {
          course = {
            ...course.toObject(),
            viewedCertificate: courseProgress?.viewedCertificate || false,
            status: courseProgress.status,
            completedPercentage: courseProgress.completedPercentage,
            completed: true
          }
          course.subjects = course.subjects.map(subject => ({
            ...subject,
            status: "completed",
            completedPercentage: 100,
            completed: true,
            lectures: subject.lectures.map(lecture => ({
              ...lecture,
              status: "completed",
              completedPercentage: 100,
              completed: true,
            })),
          }));
          return res.status(200).json({ success: true, data: course });
        } else {
          course = {
            ...course.toObject(),
            viewedCertificate: courseProgress?.viewedCertificate || false,
            status: courseProgress.status,
            completedPercentage: courseProgress.completedPercentage,
            completed: false
          }
          course.subjects = await Promise.all(course.subjects.map(async (subject) => {
            if (!(courseProgress.subjectProgress.find(p => (p.subject_id.toString() === subject._id.toString())))) {

              return ({
                ...subject,
                status: "not started",
                completedPercentage: 0,
                completed: false,
                completedPercentage: 0,
                lectures: subject.lectures.map(lecture => ({
                  ...lecture,
                  status: "not started",
                  completedPercentage: 0,
                  completed: false
                }))
              })
            } else {


              if (courseProgress.subjectProgress.find(p => (p.subject_id.toString() === subject._id.toString() && p.status === "completed"))) {
                return ({
                  ...subject,
                  status: "completed",
                  completedPercentage: 100,
                  completed: true,
                  lectures: await Promise.all(subject.lectures.map(async (lecture) => {
                    if (!(courseProgress.subjectProgress.find(p => (p.subject_id.toString() === subject._id.toString())).lecturerProgress.find(p => p.lecturer_id.toString() === lecture._id.toString()))) {
                      return ({
                        ...lecture,
                        status: "not started",
                        completedPercentage: 0,
                        completed: false,
                      })
                    } else {

                      if (courseProgress.subjectProgress.find(p => (p.subject_id.toString() === subject._id.toString())).lecturerProgress.find(p => p.lecturer_id.toString() === lecture._id.toString() && p.status === "completed")) {
                        return ({
                          ...lecture,
                          status: "completed",
                          completedPercentage: 100,
                          completed: true,
                        })
                      } else {
                        return ({
                          ...lecture,
                          status: "not started",
                          completedPercentage: 0,
                          completed: false,
                        })
                      }
                    }
                  })),
                })
              } else {
                return ({
                  ...subject,
                  status: "ongoing",
                  completedPercentage: courseProgress.subjectProgress.find(p => (p.subject_id.toString() === subject._id.toString())).completedPercentage,
                  completed: false,
                  lectures: await Promise.all(subject.lectures.map(async (lecture) => {
                    if (!(courseProgress.subjectProgress.find(p => (p.subject_id.toString() === subject._id.toString())).lecturerProgress.find(p => p.lecturer_id.toString() === lecture._id.toString()))) {
                      return ({
                        ...lecture,
                        status: "not started",
                        completedPercentage: 0,
                        completed: false,
                      })
                    } else {

                      if (courseProgress.subjectProgress.find(p => (p.subject_id.toString() === subject._id.toString())).lecturerProgress.find(p => p.lecturer_id.toString() === lecture._id.toString() && p.status === "completed")) {
                        return ({
                          ...lecture,
                          status: "completed",
                          completedPercentage: 100,
                          completed: true,
                        })
                      } else {
                        return ({
                          ...lecture,
                          status: "not started",
                          completedPercentage: 0,
                          completed: false,
                        })
                      }
                    }
                  })),
                })
              }
            }

          }));
          return res.status(200).json({ success: true, data: course });
        }
      }
    }
  }
  catch (err) {
    console.error("Error fetching course with progress:", err);
    res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

exports.getCourseandSubjectWithProgress = async (req, res) => {
  try {
    const { courseId, userId, subjectId } = req.body;

    // Fetch course with nested subjects and lectures
    let course = await Course.findById(courseId)
      .populate({
        path: "subjects",
        populate: [{
          path: "lectures",
        },
        {
          path: "notes",
        },
        {
          path: "mockTests",
        }
        ],
      });

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    // Fetch user progress for this course
    const userProgress = await UserProgress.findOne({ user_id: userId });
    if (!userProgress) {

      course = {
        ...course.toObject(),
        status: "not started",
        completedPercentage: 0,
        completed: false
      }
      course.subjects = course.subjects.map(subject => ({
        ...subject,
        status: "not started",
        completedPercentage: 0,
        completed: false,
        lectures: subject.lectures.map(lecture => ({
          ...lecture,
          status: "not started",
          completedPercentage: 0,
          completed: false,
        })),
      }));
      const finalData = course.subjects.find(sub => sub._id.toString() === subjectId);
      if (!finalData) {
        return res.status(404).json({ success: false, message: "Subject not found in course." });
      }
      return res.status(200).json({ success: true, data: finalData });
      // return res.status(200).json({ success: true, data: course });
    }

    // Initialize progress data
    let courseProgress = null;
    if (userProgress) {
      courseProgress = userProgress.courseProgress.find(p => p.course_id.toString() === courseId);

      if (!courseProgress) {
        course = {
          ...course.toObject(),
          status: "not started",
          completedPercentage: 0,
          completed: false
        }
        course.subjects = course.subjects.map(subject => ({
          ...subject,
          status: "not started",
          completedPercentage: 0,
          completed: false,
          lectures: subject.lectures.map(lecture => ({
            ...lecture,
            status: "not started",
            completedPercentage: 0,
            completed: false,
          })),
        }));
        const finalData = course.subjects.find(sub => sub._id.toString() === subjectId);
        if (!finalData) {
          return res.status(404).json({ success: false, message: "Subject not found in course." });
        }
        return res.status(200).json({ success: true, data: finalData });
        // return res.status(200).json({ success: true, data: course });
      } else {
        if (courseProgress.status === "completed") {
          course = {
            ...course.toObject(),
            status: courseProgress.status,
            completedPercentage: courseProgress.completedPercentage,
            completed: true
          }
          course.subjects = course.subjects.map(subject => ({
            ...subject,
            status: "completed",
            completedPercentage: 100,
            completed: true,
            lectures: subject.lectures.map(lecture => ({
              ...lecture,
              status: "completed",
              completedPercentage: 100,
              completed: true,
            })),
          }));
          const finalData = course.subjects.find(sub => sub._id.toString() === subjectId);
          if (!finalData) {
            return res.status(404).json({ success: false, message: "Subject not found in course." });
          }
          return res.status(200).json({ success: true, data: finalData });
          // return res.status(200).json({ success: true, data: course });
        } else {
          course = {
            ...course.toObject(),
            status: courseProgress.status,
            completedPercentage: courseProgress.completedPercentage,
            completed: false
          }
          course.subjects = await Promise.all(course.subjects.map(async (subject) => {
            if (!(courseProgress.subjectProgress.find(p => (p.subject_id.toString() === subject._id.toString())))) {

              return ({
                ...subject,
                status: "not started",
                completedPercentage: 0,
                completed: false,
                completedPercentage: 0,
                lectures: subject.lectures.map(lecture => ({
                  ...lecture,
                  status: "not started",
                  completedPercentage: 0,
                  completed: false
                }))
              })
            } else {


              if (courseProgress.subjectProgress.find(p => (p.subject_id.toString() === subject._id.toString() && p.status === "completed"))) {
                return ({
                  ...subject,
                  status: "completed",
                  completedPercentage: 100,
                  completed: true,
                  lectures: await Promise.all(subject.lectures.map(async (lecture) => {
                    if (!(courseProgress.subjectProgress.find(p => (p.subject_id.toString() === subject._id.toString())).lecturerProgress.find(p => p.lecturer_id.toString() === lecture._id.toString()))) {
                      return ({
                        ...lecture,
                        status: "not started",
                        completedPercentage: 0,
                        completed: false,
                      })
                    } else {

                      if (courseProgress.subjectProgress.find(p => (p.subject_id.toString() === subject._id.toString())).lecturerProgress.find(p => p.lecturer_id.toString() === lecture._id.toString() && p.status === "completed")) {
                        return ({
                          ...lecture,
                          status: "completed",
                          completedPercentage: 100,
                          completed: true,
                        })
                      } else {
                        return ({
                          ...lecture,
                          status: "not started",
                          completedPercentage: 0,
                          completed: false,
                        })
                      }
                    }
                  })),
                })
              } else {
                return ({
                  ...subject,
                  status: "ongoing",
                  completedPercentage: courseProgress.subjectProgress.find(p => (p.subject_id.toString() === subject._id.toString())).completedPercentage,
                  completed: false,
                  lectures: await Promise.all(subject.lectures.map(async (lecture) => {
                    if (!(courseProgress.subjectProgress.find(p => (p.subject_id.toString() === subject._id.toString())).lecturerProgress.find(p => p.lecturer_id.toString() === lecture._id.toString()))) {
                      return ({
                        ...lecture,
                        status: "not started",
                        completedPercentage: 0,
                        completed: false,
                      })
                    } else {

                      if (courseProgress.subjectProgress.find(p => (p.subject_id.toString() === subject._id.toString())).lecturerProgress.find(p => p.lecturer_id.toString() === lecture._id.toString() && p.status === "completed")) {
                        return ({
                          ...lecture,
                          status: "completed",
                          completedPercentage: 100,
                          completed: true,
                        })
                      } else {
                        return ({
                          ...lecture,
                          status: "not started",
                          completedPercentage: 0,
                          completed: false,
                        })
                      }
                    }
                  })),
                })
              }
            }

          }));
          const finalData = course.subjects.find(sub => sub._id.toString() === subjectId);
          if (!finalData) {
            return res.status(404).json({ success: false, message: "Subject not found in course." });
          }
          return res.status(200).json({ success: true, data: finalData });
        }
      }
    }
  }
  catch (err) {
    console.error("Error fetching course with progress:", err);
    res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

exports.bulkDeleteCourse = async (req, res) => {
  try {
    const { courseIds } = req.body;
    if (courseIds.length === 0) {
      return res.status(400).json({ success: false, message: "No course ids provided." });
    }
    let result = [];
    for (const courseId of courseIds) {
      try {
        const course = await Course.findById(courseId);

        if (!course) {
          result.push({ courseId, success: false, message: "Course not found" });
          continue;
        }
        await Promise.all(
          course.subjects.map(async (subjectId) => {
            const subject = await Subject.findById(subjectId);
            if (!subject) {
              return;
            }
            subject.courses.pull(courseId);
            await subject.save();

          }))
        await Promise.all(
          course.recorded_sessions.map(async (sessionId) => {
            const session = await RecordedSession.findById(sessionId);
            if (!session) {
              return;
            }
            session.courses.pull(courseId);
            await session.save();
          })
        )
        await Promise.all(
          course.student_feedback.map(async (feedbackId) => {
            const feedback = await Feedback.findByIdAndDelete(feedbackId);
          })
        )
        const courseProgress = await CourseProgress.findOneAndDelete({ course_id: courseId });

        const meeting = await Meeting.findOneAndDelete({ course_Ref: courseId });
        await Promise.all(
          course.student_enrolled.map(async (studentId) => {
            const student = await User.findById(studentId);
            const foundSubscription = student.subscription.find(sub => sub.course_enrolled.equals(courseId));
            if (!foundSubscription) {
              return;
            }
            const payment = await Payment.findByIdAndDelete(foundSubscription.payment_id);
            const certificate = await Certificate.findOneAndDelete({ course_ref: courseId, user_ref: studentId });
            const userProgress = await UserProgress.findOne({ user_ref: studentId });
            if (userProgress) {
              userProgress.courseProgress = userProgress.courseProgress.filter(progress => !progress.course_id.equals(courseId));
              await userProgress.save();
            }
            student.subscription = student.subscription.filter(sub => !sub.course_enrolled.equals(courseId));
            await student.save();
          })
        )

        const deletedCourse = await Course.findByIdAndDelete(courseId);

        if (!deletedCourse) {
          result.push({ courseId, success: false, message: "Course not found" });
          continue;
        }

        result.push({ courseId, success: true, message: "Course deleted successfully", data: deletedCourse });
      } catch (error) {
        result.push({ courseId, error: error.message });
      }
    }
    res.status(200).json({
      success: true,
      message: "Bulk delete operation completed",
      data: result,
    });
  } catch (error) {
    console.error("Error deleting course:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not delete course.",
      error: error.message,
    });
  }
};

exports.getAllCourseAdmin = async (req, res) => {
  try {
    const courses = await Course.find()
       .populate({
        path: "subjects",
        select: "subjectName image description lectures notes",
        populate: [
          {
            path: "lectures",
            // select: "_id"
          },
          {
            path: "notes",
            // select: "_id"
          },
          {
            path: "mockTests",
            // select: "_id"

          }

        ]
      })
      .populate("category",)
      .populate("student_feedback")
      .populate("student_enrolled")
      .populate("mockTests")
      .populate("recorded_sessions");
    return res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error("Error fetching all courses:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch all courses.",
      error: error.message,
    });
  }
}

exports.getCategoriesWithCourses = async (req, res) => {
  try {
    // Get all categories (or only featured if specified)
    const filter = {};
   
      filter.featured = true;
    
    
    const categories = await Category.find(filter);
    
    if (!categories || categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No categories found"
      });
    }
    const allCourses = await Course.find({ isPublished: true })
      .populate("subjects",)
      .populate("category",)
      .populate("student_feedback")
      .populate("student_enrolled")
      .populate("mockTests")
      .populate("recorded_sessions")
      .lean();
    
    const categoriesWithCourses = await Promise.all(
      categories.map(async (category) => {
        const courses = await Course.find({
          category: category._id,
          isPublished: true,
        })
        .populate("subjects",)
        .populate("category",)
        .populate("student_feedback")
        .populate("student_enrolled")
        .populate("mockTests")
        .populate("recorded_sessions")
        // .select("courseName courseDisplayName shortDescription price discountPrice discountActive image rating course_rating duration no_of_videos instructors student_enrolled")
        .limit(parseInt(req.query.limit) || 5) // Default to 5 courses per category
        .lean(); // Return plain JavaScript objects
        
        // Add student count to each course
        const coursesWithStudentCount = courses.map(course => ({
          ...course,
          student_enrolled_count: course.student_enrolled ? course.student_enrolled.length : 0
        }));
        
        return {
          category: {
            _id: category._id,
            title: category.title,
            featured: category.featured
          },
          courses: coursesWithStudentCount
        };
      })
    );
    
    // // Filter out categories with no courses
    // const filteredCategories = categoriesWithCourses.filter(
    //   item => item.courses && item.courses.length > 0
    // );
    
    res.status(200).json({
      success: true,
      data: {
        featuredCategories: categories,
        coursesWithCategories: categoriesWithCourses,
        allCourses: allCourses
      }
    });
  } catch (error) {
    console.error("Error fetching categories with courses:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching categories with courses"
    });
  }
};
