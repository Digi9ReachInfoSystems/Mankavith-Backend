const RecordedSession = require("../model/recorded_sessionModel");
const Course = require("../model/course_model");

// Create a new recorded session
exports.createRecordedSession = async (req, res) => {
  try {
    const { course_ref, title, description, videoUrl, duration } = req.body;

    // Validate required fields
    if (!course_ref || !title || !description || !videoUrl || !duration) {
      return res.status(400).json({
        success: false,
        message:
          "All fields (course_ref, title, description, videoUrl, duration) are required",
      });
    }

    // Validate course exists
    const course = await Course.findById(course_ref);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const newSession = new RecordedSession({
      course_ref,
      title,
      description,
      videoUrl,
      duration,
    });

    const savedSession = await newSession.save();
    course.recorded_sessions.push(savedSession._id);
    await course.save(); // Save the course to update recorded_sessions
    return res.status(201).json({
      success: true,
      message: "Recorded session created successfully",
      data: savedSession,
    });
  } catch (error) {
    console.error("Error creating recorded session:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not create recorded session.",
      error: error.message,
    });
  }
};

// Get all recorded sessions
exports.getAllRecordedSessions = async (req, res) => {
  try {
    const { courseId } = req.query;
    let query = {};

    if (courseId) {
      query.course_ref = courseId;
    }

    const sessions = await RecordedSession.find(query)
      .populate("course_ref", "courseName duration price")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    console.error("Error fetching recorded sessions:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch recorded sessions.",
      error: error.message,
    });
  }
};

// Get recorded session by ID
exports.getRecordedSessionById = async (req, res) => {
  try {
    const sessionId = req.params.id;

    const session = await RecordedSession.findById(sessionId).populate(
      "course_ref",
      "courseName duration price"
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Recorded session not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("Error fetching recorded session by ID:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch recorded session.",
      error: error.message,
    });
  }
};

// Update recorded session
exports.updateRecordedSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { title, description, videoUrl, duration, course_ref } = req.body;
    console.log(req.body);

    // Validate at least one field is provided
    if (!title && !description && !videoUrl && !duration) {
      return res.status(400).json({
        success: false,
        message:
          "At least one field (title, description, videoUrl, duration) to update is required",
      });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (videoUrl) updateData.videoUrl = videoUrl;
    if (duration) updateData.duration = duration;

    const recordedSession = await RecordedSession.findById(sessionId);
    if (!recordedSession) {
      return res.status(404).json({
        success: false,
        message: "Recorded session not found",
      });
    }
    await Promise.all(recordedSession.course_ref.map(async (courseId) => {
      const course = await Course.findById(courseId);
      if (course) {
        if (course.recorded_sessions.length > 0) {
          course.recorded_sessions.pull(sessionId);
        }
        await course.save();
      }



    }))

    if (course_ref.length > 0) {
      
      course_ref.map(async (course_ref) => {

        const course = await Course.findById(course_ref);
        if (!course.recorded_sessions) {
          course.recorded_sessions = [];
        }
        course.recorded_sessions.push(sessionId);
        await course.save();
      })
      updateData.course_ref = course_ref;
    }

    const updatedSession = await RecordedSession.findByIdAndUpdate(
      sessionId,
      updateData,
      { new: true, runValidators: true }
    ).populate("course_ref", "courseName duration price");

    if (!updatedSession) {
      return res.status(404).json({
        success: false,
        message: "Recorded session not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Recorded session updated successfully",
      data: updatedSession,
    });
  } catch (error) {
    console.error("Error updating recorded session:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not update recorded session.",
      error: error.message,
    });
  }
};

// Delete recorded session
exports.deleteRecordedSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await RecordedSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Recorded session not found",
      });
    }

    await Promise.all(session.course_ref.map(async (courseId) => {
      const course = await Course.findById(courseId);
      course.recorded_sessions.pull(sessionId);
      await course.save();
    }))

    const deletedSession = await RecordedSession.findByIdAndDelete(sessionId);

    if (!deletedSession) {
      return res.status(404).json({
        success: false,
        message: "Recorded session not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Recorded session deleted successfully",
      data: deletedSession,
    });
  } catch (error) {
    console.error("Error deleting recorded session:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not delete recorded session.",
      error: error.message,
    });
  }
};

// Get sessions by course ID
exports.getSessionsByCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;

    const sessions = await RecordedSession.find({ course_ref: courseId })
      .populate("course_ref", "courseName duration price")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    console.error("Error fetching sessions by course:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch sessions.",
      error: error.message,
    });
  }
};

exports.bulkDeleteRecordedSession = async (req, res) => {
  try {
    const { sessionIds } = req.body;

    if (!sessionIds || sessionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one session ID to delete.",
      });
    }
    let result = [];

    for (const sessionId of sessionIds) {
      try {


        const session = await RecordedSession.findById(sessionId);

        if (!session) {
          result.push({ sessionId, success: false, message: "Session not found" });
          continue;
        }

        await Promise.all(session.course_ref.map(async (courseId) => {
          const course = await Course.findById(courseId);
          course.recorded_sessions.pull(sessionId);
          await course.save();
        }))

        const deletedSession = await RecordedSession.findByIdAndDelete(sessionId);

        if (!deletedSession) {
          result.push({ sessionId, success: false, message: "Session not found" });
          continue;
        }

        result.push({ sessionId, success: true, message: "Session deleted successfully", data: deletedSession });

      } catch (error) {
        result.push({ sessionId, success: false, message: "Session not found" });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Recorded sessions deleted successfully",
      data: result,
    });

  } catch (error) {
    console.error("Error deleting recorded sessions:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not delete recorded sessions.",
      error: error.message,
    });
  }
};
