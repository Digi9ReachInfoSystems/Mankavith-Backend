const Course = require("../model/course_model");
const Category = require("../model/category_model");
const Subject = require("../model/subject_model");
const User = require("../model/user_model");
const UserProgress = require("../model/userProgressModel");

// Create a new course (updated for category reference)
exports.createCourse = async (req, res) => {
  try {
    const courseData = req.body;

    // Validate category if provided
    if (courseData.category) {
      const categoryExists = await Category.findById(courseData.category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: "Category not found",
        });
      }
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
      .populate("subjects", "subjectName")
      .populate("category", "title")
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
      .populate("subjects", "subjectName")
      .populate("category", "title");

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
    const courses = await Course.find({ category: category._id })
      .populate("subjects", "subjectName")
      .populate("category", "title");

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
    const updateData = req.body;

    // Validate category if provided in update
    if (updateData.category) {
      const categoryExists = await Category.findById(updateData.category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: "Category not found",
        });
      }
    }

    const updatedCourse = await Course.findByIdAndUpdate(courseId, updateData, {
      new: true,
      runValidators: true,
    })
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

    const course = await Course.findById(courseId)
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
      .populate("category", "title");

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
    const count = await Course.countDocuments();
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
    let courses = await Course.find();
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
    let courses = await Course.find({ category: categoryExists._id });
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

    // Fetch course with nested subjects and lectures
    let course = await Course.findById(courseId)
      .populate({
        path: "subjects",
        populate: [{
          path: "lectures",
        }],
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

      return res.status(200).json({ success: true, data: course });
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

        return res.status(200).json({ success: true, data: course });
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
          return res.status(200).json({ success: true, data: course });
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

      return res.status(200).json({ success: true, data: course });
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

        return res.status(200).json({ success: true, data: course });
      } else {
        if (courseProgress.status === "completed") {
          course = {
            ...course.toObject(),
            status: courseProgress.status,
            completedPercentage: courseProgress.completedPercentage,
            completed: true
          }
          course.subjects = course.subjects.map(subject => ({
            ...subject.toObject(),
            status: "completed",
            completedPercentage: 100,
            completed: true,
            lectures: subject.lectures.map(lecture => ({
              ...lecture.toObject(),
              status: "completed",
              completedPercentage: 100,
              completed: true,
            })),
          }));
          return res.status(200).json({ success: true, data: course });
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