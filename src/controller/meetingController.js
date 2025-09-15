// controllers/meetingController.js
const axios = require("axios");
const Meeting = require("../model/meetingsModel");
const Student = require("../model/studentModel");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const KJUR = require("jsrsasign");
const Course = require("../model/course_model");
const User = require("../model/user_model");
const { inNumberArray, isBetween, isRequiredAllOrNone, validateRequest } = require("../utils/validations");
const Notification = require("../model/userNotificationModel");
const zoomAccountId = process.env.ZOOM_ACCOUNT_ID;
const zoomClientId = process.env.ZOOM_CLIENT_ID;
const zoomClientSecret = process.env.ZOOM_CLIENT_SECRET;
const crypto = require('crypto');
async function getZoomAccessToken() {
  const res = await axios.post("https://zoom.us/oauth/token", null, {
    params: {
      grant_type: "account_credentials",
      account_id: process.env.ZOOM_ACCOUNT_ID,
    },
    auth: {
      username: process.env.ZOOM_CLIENT_ID,
      password: process.env.ZOOM_CLIENT_SECRET,
    },
  });
  return res.data.access_token; // valid for 1 h
}

exports.createZoomMeeting = async (req, res) => {
  try {
    const {
      courseId, // REQUIRED – MongoID
      studentIds, // REQUIRED – [MongoID, …]
      topic, // REQUIRED
      startTime, // REQUIRED ISO-8601
      duration, // REQUIRED minutes
      recurrence, // OPTIONAL object
      hostId, // OPTIONAL – create for a specific Zoom user
      scheduleFor, // OPTIONAL – email of alternate host (will own meeting)
      agenda, // OPTIONAL
      password, // OPTIONAL
      settings, // OPTIONAL – partial settings object
    } = req.body;

    /* ---------- 1. basic field validation --------------------------------- */
    const missing = [];
    if (!courseId) missing.push("courseId");
    if (!topic) missing.push("topic");
    if (!startTime) missing.push("startTime");
    if (!duration) missing.push("duration");
    if (!Array.isArray(studentIds) || !studentIds.length)
      missing.push("studentIds");

    if (missing.length)
      return res
        .status(400)
        .json({ msg: `Missing fields: ${missing.join(", ")}` });

    /* ---------- 2. determine meeting type --------------------------------- */
    const zoomType = recurrence ? 8 : 2; // 8 = recurring fixed time, 2 = one-off :contentReference[oaicite:0]{index=0}
    const includeRecur = zoomType === 8;

    /* ---------- 3. build minimal Zoom payload ----------------------------- */
    const zoomPayload = {
      topic,
      type: zoomType,
      start_time: startTime, // must include offset or 'Z'
      duration,
      timezone: process.env.TZ || "Asia/Kolkata",
      agenda,
      password,
      ...(includeRecur && { recurrence }),
      settings: {
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: true,
        ...(settings || {}), // merge any optional flags
      },
      ...(scheduleFor && { schedule_for: scheduleFor }),
    };

    /* ---------- 4. create on Zoom ----------------------------------------- */
    const accessToken = await getZoomAccessToken();
    const zoomPath = `https://api.zoom.us/v2/users/${hostId || "me"}/meetings`;

    let z;
    try {
      ({ data: z } = await axios.post(zoomPath, zoomPayload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }));
    } catch (zoomErr) {
      console.error("Zoom 400/502 ►", zoomErr?.response?.data || zoomErr);
      return res
        .status(502)
        .json({ error: zoomErr?.response?.data?.message || "Zoom error" });
    }

    /* ---------- 5. persist in Mongo --------------------------------------- */
    const meetingDoc = await Meeting.create({
      meeting_title: topic,
      meeting_url: z.join_url,
      meeting_time: new Date(startTime),
      meeting_duration: duration,
      course_Ref: courseId,
      students: studentIds,
      zoom_meeting_id: z.id,
      zoom_passcode: z.password,
      zoom_start_url: z.start_url,
      zoom_join_url: z.join_url,
    });

    // push reference into every student only once
    await Student.updateMany(
      { _id: { $in: studentIds } },
      { $addToSet: { scheduled_meet: meetingDoc._id } }
    );

    /* ---------- 6. respond ------------------------------------------------- */
    res.status(201).json({
      meeting: meetingDoc,
      sdkInfo: {
        meetingNumber: z.id.toString(),
        passcode: z.password,
        // Your /api/meetings/zoom/signature endpoint should add the signature
      },
    });
  } catch (err) {
    console.error("Server error ►", err);
    res.status(500).json({ error: "Unable to create Zoom meeting" });
  }
};


exports.getAllmeetings = async (req, res) => {
  try {
    // Optional filters ?courseId=…&from=2025-05-01&to=2025-05-31
    const { courseId, from, to, hostEmail, isSuperAdmin } = req.query;
    const filter = {};
    const currentTime = new Date();
    if (courseId) filter.course_Ref = courseId;
    if (from || to) filter.meeting_time = {};
    if (from) filter.meeting_time.$gte = new Date(from);
    if (to) filter.meeting_time.$lte = new Date(to);
    if (!isSuperAdmin) {
      filter.host_email = hostEmail;

    }

    // if (hostEmail) filter.host_email = hostEmail;
    console.log("filter", filter);

    let meetings = await Meeting.find(filter)
      .sort({ meeting_time: 1 }) // ascending
      .populate("course_Ref")
      .lean();
    const activeMeetings = meetings.filter(meeting => {
      const endTime = new Date(meeting.meeting_time.getTime() + (meeting.meeting_duration * 60000));
      return endTime >= currentTime;
    });
    meetings = meetings.map((meeting) => {
      if (activeMeetings.indexOf(meeting) === -1) {
        if (hostEmail && meeting.host_email == hostEmail) {
          return {
            ...meeting,
            isPastMeeting: true,
            isHostMeeting: true
          };
        } else {
          return {
            ...meeting,
            isPastMeeting: true,
            isHostMeeting: false
          };
        }

      } else {
        if (hostEmail && meeting.host_email == hostEmail) {
          return {
            ...meeting,
            isPastMeeting: false,
            isHostMeeting: true
          };
        } else {
          return {
            ...meeting,
            isPastMeeting: false,
            isHostMeeting: false
          };
        }
      }
    });

    res.json(meetings);
  } catch (err) {
    console.error("getAllmeetings ►", err);
    res.status(500).json({ error: "Unable to fetch meetings" });
  }
};

exports.getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findById(id)
      .populate("course_Ref",)
      .lean();

    if (!meeting) return res.status(404).json({ msg: "Meeting not found" });

    res.json(meeting);
  } catch (err) {
    console.error("getmeetingById ►", err);
    res.status(500).json({ error: "Unable to fetch meeting" });
  }
};

exports.getmeetingBystudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { upcoming } = req.query; // ?upcoming=true

    // 1. quick sanity-check on ObjectId
    if (!mongoose.Types.ObjectId.isValid(studentId))
      return res.status(400).json({ msg: "Invalid studentId" });

    // 2. pull only the scheduled_meet array (faster than full populate first)
    const student = await Student.findById(studentId)
      .select("scheduled_meet")
      .lean();

    if (!student) return res.status(404).json({ msg: "Student not found" });

    if (!student.scheduled_meet?.length) return res.json([]); // nothing scheduled yet

    // 3. build Meeting query
    const meetingFilter = { _id: { $in: student.scheduled_meet } };
    if (upcoming === "true") {
      meetingFilter.meeting_time = { $gte: new Date() };
    }

    // 4. fetch & populate
    const meetings = await Meeting.find(meetingFilter)
      .sort({ meeting_time: 1 }) // earliest first
      .populate("course_Ref", "name") // -> course_Ref: { _id, name }
      .select(
        "meeting_title meeting_time meeting_duration zoom_join_url zoom_passcode course_Ref"
      )
      .lean();

    res.json(meetings);
  } catch (err) {
    console.error("getmeetingBystudent ►", err);
    res.status(500).json({ error: "Unable to fetch meetings for student" });
  }
};




exports.getZoomSdkAccessToken = async (req, res) => {
  try {
    const accessToken = await getZoomAccessToken();
    res.json({ accessToken });
  } catch (error) {
    res.status(500).json({ error: "Failed to get Zoom access token." });
  }
};


const base64 = require("base-64");
const { meetingScheduledMail, meetingCancelledMail, meetingStartedMail } = require("../middleware/mailService");



const getAuthHeaders = () => {
  return {
    Authorization: `Basic ${base64.encode(
      `${zoomClientId}:${zoomClientSecret}`
    )}`,
    "Content-Type": "application/json",
  };
};

const generateZoomAccessToken = async () => {
  try {
    const response = await axios.post(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${zoomAccountId}`,
      null, // No request body needed for this POST request
      {
        headers: getAuthHeaders()
      }
    );

    const jsonResponse = await response.data;

    return jsonResponse?.access_token;
  } catch (error) {
    console.log("generateZoomAccessToken Error --> ", error);
    throw error;
  }
};

// exports.generateZoomMeeting = async (req, res) => {
//   try {
//     const zoomAccessToken = await generateZoomAccessToken();

//     const response = await axios.post(
//       'https://api.zoom.us/v2/users/me/meetings',
//       {
//         agenda: "Zoom Meeting for YT Demo",
//         default_password: false,
//         duration: 60,
//         password: "12345",
//         settings: {
//           allow_multiple_devices: true,
//           // alternative_hosts: "jayanthbr@digi9.co.in",
//           // alternative_hosts_email_notification: true,
//           breakout_room: {
//             enable: true,
//             rooms: [
//               {
//                 name: "room1",
//                 participants: [
//                   "email1@gmail.com",
//                   "email2@gmail.com",
//                 ],
//               },
//             ],
//           },
//           calendar_type: 1,
//           contact_email: "jayanthbr@digi9.co.in",
//           contact_name: "Ajay Sharma",
//           email_notification: true,
//           encryption_type: "enhanced_encryption",
//           focus_mode: true,
//           host_video: true,
//           join_before_host: true,
//           meeting_authentication: true,
//           meeting_invitees: [
//             {
//               email: "jayanthbr@digi9.co.in",
//             },
//           ],
//           mute_upon_entry: true,
//           participant_video: true,
//           private_meeting: true,
//           waiting_room: false,
//           watermark: false,
//           continuous_meeting_chat: {
//             enable: true,
//           },
//         },
//         start_time: new Date().toLocaleDateString(),
//         timezone: "Asia/Kolkata",
//         topic: "Zoom Meeting for YT Demo",
//         type: 2,
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${zoomAccessToken}`
//         }
//       }
//     );

//     // Access response data with response.data

//     const jsonResponse = response.data;

//     console.log("generateZoomMeeting JsonResponse --> ", jsonResponse);
//     res.status(200).json({
//       message: "Zoom meeting created successfully",
//       data: jsonResponse,
//     });
//   } catch (error) {
//     console.log("generateZoomMeeting Error --> ", error);
//     throw error;
//   }
// };



exports.getALLUpcomingMeetings = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    let courseId = await Promise.all(user.subscription.map(async (subscription) => {
      const course = await Course.findById(subscription.course_enrolled);
      if (course.isKycRequired) {
        if (user.kyc_status != "rejected" && user.kyc_status != "not-applied") {
          return course._id
        } else {
          return null
        }
      } else {
        return course._id
      }

    }))

    courseId = courseId.filter((course) => course !== null);
    const meetings = await Meeting.find(
      {
        course_Ref: { $in: courseId },
        meeting_time: {
          $gte: new Date(),
        },
        isEnded: false
      }
    ).populate("course_Ref");
    res.status(200).json({
      message: "All upcoming meetings fetched successfully",
      data: meetings,
    });
  } catch (error) {
    console.error("getALLUpcomingMeetings Error --> ", error);
    res.status(500).json({
      message: "Error fetching meetings",
      error: error.message
    });
  }
};

exports.generateMeetingSugnature = async (req, res) => {
  try {
    let body = req.body
    if (!body) body = {}
    body.expirationSeconds = 172800;
    const requestBody = coerceRequestBody(body);
    const validationErrors = validateRequest(requestBody, propValidations, schemaValidations)

    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors })
    }

    const { meetingNumber, role, expirationSeconds, videoWebRtcMode } = requestBody
    const iat = Math.floor(Date.now() / 1000) - 30
    const exp = expirationSeconds ? iat + expirationSeconds : iat + 60 * 60 * 2
    const oHeader = { alg: 'HS256', typ: 'JWT' }

    const oPayload = {
      appKey: process.env.ZOOM_MEETING_SDK_KEY,
      sdkKey: process.env.ZOOM_MEETING_SDK_KEY,
      mn: meetingNumber,
      role,
      iat,
      exp,
      tokenExp: exp,
      video_webrtc_mode: videoWebRtcMode || 0
    }
    console.log(oPayload)
    const sHeader = JSON.stringify(oHeader)
    const sPayload = JSON.stringify(oPayload)
    const sdkJWT = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, process.env.ZOOM_MEETING_SDK_SECRET)
    return res.json({ signature: sdkJWT, sdkKey: process.env.ZOOM_MEETING_SDK_KEY })

  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to generate Zoom signature.".error });
  }
};
const propValidations = {
  role: inNumberArray([0, 1]),
  expirationSeconds: isBetween(1800, 172800),
  videoWebRtcMode: inNumberArray([0, 1])
}

const schemaValidations = [isRequiredAllOrNone(['meetingNumber', 'role'])]

const coerceRequestBody = (body) => ({
  ...body,
  ...['role', 'expirationSeconds', 'videoWebRtcMode'].reduce(
    (acc, cur) => ({ ...acc, [cur]: typeof body[cur] === 'string' ? parseInt(body[cur]) : body[cur] }),
    {}
  )
})

exports.createZoomMeetingMeOrOtherHost = async (req, res) => {
  try {
    const {
      topic,
      agenda,
      password,
      meeting_type = "me",
      hostId,
      courseIds,
      startTime,
      duration,
      autoRecord = false,

    } = req.body;

    /* ---------- 1. basic field validation --------------------------------- */
    const missing = [];
    if (!Array.isArray(courseIds) || courseIds.length == 0) missing.push("courseId");
    if (!topic) missing.push("topic");
    if (!startTime) missing.push("startTime");
    if (!duration) missing.push("duration");

    if (missing.length)
      return res
        .status(400)
        .json({ msg: `Missing fields: ${missing.join(", ")}` });


    let zoomPayload = {};
    if (meeting_type == "other_host" && !hostId) {
      return res.status(400).json({ msg: "hostId is required when meeting_type is other_host" });
    }
    if (meeting_type == "me") {
      zoomPayload = {
        topic,
        type: 2,
        start_time: startTime, // must include offset or 'Z'
        duration,
        timezone: process.env.TZ || "Asia/Kolkata",
        agenda,
        password,
        settings: {
          email_notification: false,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
          auto_recording: autoRecord ? "cloud" : "none",
        },
      };
    } else {
      zoomPayload = {
        topic,
        type: 2,
        start_time: startTime, // must include offset or 'Z'
        duration,
        timezone: process.env.TZ || "Asia/Kolkata",
        agenda,
        password,
        settings: {
          email_notification: false,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
          auto_recording: autoRecord ? "cloud" : "none",
        },
        schedule_for: hostId,
      };
    }

    //  else if (meeting_type == "both") {
    //   zoomPayload = {
    //     topic,
    //     type: 2,
    //     start_time: startTime, // must include offset or 'Z'
    //     duration,
    //     timezone: process.env.TZ || "Asia/Kolkata",
    //     agenda,
    //     password,
    //     settings: {
            //  email_notification: false,
    //       join_before_host: false,
    //       mute_upon_entry: true,
    //       waiting_room: true,
    //       auto_recording: autoRecord ? "cloud" : "none",
    //       alternative_hosts: hostId,
    //     },
    //   };

    // }

    const accessToken = await getZoomAccessToken();

    // const hostDetails = await axios.get(`https://api.zoom.us/v2/users/me`, {
    //   headers: { Authorization: `Bearer ${accessToken}` },
    // });
    let zoomPath = '';
    console.log("zoomPayload", zoomPayload);
    if (meeting_type == "other_host") {
      zoomPath = `https://api.zoom.us/v2/users/${hostId}/meetings`;
    } else {
      zoomPath = `https://api.zoom.us/v2/users/me/meetings`;
    }
    // else if (meeting_type == "both") {
    //   zoomPath = `https://api.zoom.us/v2/users/me/meetings`;
    // } 


    let responseData = {};
    try {
      ({ data: responseData } = await axios.post(zoomPath, zoomPayload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }));
    } catch (zoomErr) {
      console.error("Zoom 400/502 ►", zoomErr?.response?.data || zoomErr);
      return res
        .status(502)
        .json({ error: zoomErr?.response?.data?.message || "Zoom error" });
    }

    const meetingDoc = await Meeting.create({
      meeting_title: topic,
      meeting_agenda: agenda,
      assistant_id: responseData?.assistant_id || null,
      host_email: responseData?.host_email || null,
      meeting_url: responseData.join_url,
      meeting_time: new Date(startTime),
      meeting_duration: duration,
      course_Ref: courseIds,
      zoom_meeting_id: responseData.id,
      zoom_passcode: responseData.password,
      zoom_start_url: responseData.start_url,
      zoom_join_url: responseData.join_url,
      zoom_type: responseData.type,
      meeting_type: meeting_type,

    });
    let students = [];
    for (const courseId of courseIds) {
      const course = await Course.findById(courseId);
      if (course) {
        students = students.concat(course.student_enrolled);
      }
    }
    let uniqueStudentIds = [...new Set(students.map(id => id))];
    let studentEmails = [];
    for (const studentId of uniqueStudentIds) {
      const student = await User.findById(studentId);
      if (student) {
        const studentNotification = await Notification.create({
          title: `Meeting Crea
          ted ${topic}`,
          description: agenda,
          time: startTime,
          // image,
          notificationType: "ZOOM MEETING",
          user_ref: student._id,
          read: false
        })
        await studentNotification.save();
        studentEmails.push(student.email);
      }
    }
    meetingScheduledMail(meetingDoc, meetingDoc.host_email, studentEmails);
    res.status(201).json({
      meeting: meetingDoc,
      sdkInfo: {
        meetingNumber: responseData.id.toString(),
        passcode: responseData.password,
      },
    });
  } catch (err) {
    console.error("Server error ►", err);
    res.status(500).json({ error: "Unable to create Zoom meeting" });
  }
};


exports.deleteMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found" });
    }
    const accessToken = await getZoomAccessToken();
    let zoomResponse = {}
    const zoomPath = `https://api.zoom.us/v2//meetings/${meeting.zoom_meeting_id}?&schedule_for_reminder=true&cancel_meeting_reminder=true`;
    try {
      ({ data: responseData } = await axios.delete(zoomPath, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }));
      console.log("Zoom delete response", responseData);
      await Meeting.findByIdAndDelete(id);
    } catch (zoomErr) {
      console.error("Zoom 400/502 ►", zoomErr?.response?.data || zoomErr);
      return res
        .status(502)
        .json({ error: zoomErr?.response?.data?.message || "Zoom error" });
    }


    res
      .status(200)
      .json({ success: true, message: "Meeting deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting meeting",
      error: error.message,
    });
  }
};

exports.updateMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      topic,
      agenda,
      password,
      hostId,
      meeting_type = "me",
      courseIds,
      startTime,
      duration,
    } = req.body;
    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found" });
    }
    const accessToken = await getZoomAccessToken();
    const zoomPath = `https://api.zoom.us/v2/meetings/${meeting.zoom_meeting_id}`;
    let zoomPayload = {

    }
    if (meeting_type == "other_host" && !hostId) {
      return res
        .status(400)
        .json({ error: "Please provide hostId" });
    }
    if (meeting_type == "me") {
      zoomPayload = {
        topic,
        agenda,
        password,
        start_time: startTime, // must include offset or 'Z'
        duration,
      };
    } else {
      zoomPayload = {
        topic,
        agenda,
        password,
        start_time: startTime, // must include offset or 'Z'
        duration,
        schedule_for: hostId,
      };
    }
    let responseData = {};

    try {
      ({ data: responseData } = await axios.patch(zoomPath, zoomPayload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }));
    } catch (zoomErr) {
      console.error("Zoom 400/502 ►", zoomErr?.response?.data || zoomErr);
      return res
        .status(502)
        .json({ error: zoomErr?.response?.data?.message || "Zoom error" });
    }
    let updatedMeetingDetails = {}
    try {
      ({ data: updatedMeetingDetails } = await axios.get(`https://api.zoom.us/v2/meetings/${meeting.zoom_meeting_id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }));
    } catch (zoomErr) {
      console.error("Zoom 400/502 ►", zoomErr?.response?.data || zoomErr);
      return res
        .status(502)
        .json({ error: zoomErr?.response?.data?.message || "Zoom error" });
    }

    console.log("Zoom update response", updatedMeetingDetails);
    const updatedMeeting = await Meeting.findByIdAndUpdate(
      id,
      {
        meeting_title: topic,
        meeting_agenda: agenda,
        assistant_id: updatedMeetingDetails?.assistant_id || null,
        host_email: updatedMeetingDetails?.host_email || null,
        meeting_url: updatedMeetingDetails.join_url,
        meeting_time: new Date(startTime),
        meeting_duration: duration,
        course_Ref: courseIds,
        zoom_meeting_id: updatedMeetingDetails.id,
        zoom_passcode: updatedMeetingDetails.password,
        zoom_start_url: updatedMeetingDetails.start_url,
        zoom_join_url: updatedMeetingDetails.join_url,
        zoom_type: updatedMeetingDetails.type,
        meeting_type: meeting_type,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Meeting updated successfully",
      data: updatedMeeting,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating meeting",
      error: error.message,
    });
  }
};

exports.getmeetingByHostEmail = async (req, res) => {
  try {
    const { hostEmail } = req.body;
    const { upcoming } = req.query; // ?upcoming=true
    let currentTime = new Date();
    let meetings = [];
    if (upcoming === "true") {
      meetings = await Meeting.find({
        host_email: hostEmail,
        meeting_time: {
          $gte: new Date(currentTime.getTime() - (24 * 60 * 60000))
        },
      }).sort({ meeting_time: 1 });
      const activeMeetings = meetings.filter(meeting => {
        const endTime = new Date(meeting.meeting_time.getTime() + (meeting.meeting_duration * 60000));
        return endTime >= currentTime;
      });
      meetings = activeMeetings;
      meetings = meetings.map((meeting) => {
        return {
          ...meeting._doc,
          isPastMeeting: false
        };
      });
    } else {
      meetings = await Meeting.find({ host_email: hostEmail }).sort({
        createdAt: -1,
      });
      const activeMeetings = meetings.filter(meeting => {
        const endTime = new Date(meeting.meeting_time.getTime() + (meeting.meeting_duration * 60000));
        return endTime >= currentTime;
      });


      meetings.map((meeting) => {
        if (activeMeetings.indexOf(meeting) === -1) {
          return {
            ...meeting._doc,
            isPastMeeting: true
          }
        } else {
          return {
            ...meeting._doc,
            isPastMeeting: false
          }
        }
      });
    }
    res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting meeting by host email",
      error: error.message,
    });
  }
};

exports.bulkDeleteMeetings = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide an array of IDs" });
    }
    let results = [];
    for (const id of ids) {
      try {
        const meeting = await Meeting.findById(id);
        if (!meeting) {
          results.push({ id, success: false, message: "Meeting not found" });
          continue;
        }
        const accessToken = await getZoomAccessToken();
        let zoomResponse = {}
        const zoomPath = `https://api.zoom.us/v2//meetings/${meeting.zoom_meeting_id}?&schedule_for_reminder=true&cancel_meeting_reminder=true`;
        try {
          ({ data: responseData } = await axios.delete(zoomPath, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }));
          console.log("Zoom delete response", responseData);
          let students = [];
          for (const courseId of meeting.course_Ref) {
            const course = await Course.findById(courseId);
            if (course) {
              students = students.concat(course.student_enrolled);
            }
          }
          let uniqueStudentIds = [...new Set(students.map(id => id))];
          let studentEmails = [];
          for (const studentId of uniqueStudentIds) {
            const student = await User.findById(studentId);
            if (student) {
              const studentNotification = await Notification.create({
                title: `Meeting Cancelled ${meeting.meeting_title}`,
                description: meeting.meeting_agenda,
                time: meeting.meeting_time,
                // image,
                notificationType: "ZOOM MEETING",
                user_ref: student._id,
                read: false
              })
              await studentNotification.save();
              studentEmails.push(student.email);
            }
          }
          meetingCancelledMail(meeting, meeting.host_email, studentEmails);


          await Meeting.findByIdAndDelete(id);
        } catch (zoomErr) {
          console.error("Zoom 400/502 ►", zoomErr?.response?.data || zoomErr);
          results.push({ id, success: false, message: zoomErr?.response?.data?.message || "Zoom error" });
        }

        results.push({ id, success: true, message: "Meeting deleted successfully" });
      } catch (err) {
        console.error(`Error deleting meeting with ID ${id}:`, err);
        results.push({ id, success: false, message: err.message });
        continue;
      }
    }
    res.status(200).json({ success: true, results });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting meeting",
      error: error.message,
    });
  }
};

exports.getUpcomingAndOngoingMeetings = async (req, res) => {
  try {
    const { courseIds } = req.body;
    const now = new Date();
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60000);


    // First get all meetings for these courses that might be relevant
    const meetings = await Meeting.find({
      course_Ref: { $in: courseIds },
      isEnded: false,
      $or: [
        // Meetings starting in next 5 minutes
        {
          meeting_time: {
            $gte: now,
            $lte: fiveMinutesLater
          }
        },
        // Meetings that have started but might still be ongoing
        {
          meeting_time: { $lte: now }
        }
      ]
    }).populate("course_Ref");
    // console.log("getUpcomingAndOngoingMeetings Meetings --> ", meetings);

    // Then filter in JavaScript to find ongoing meetings
    const results = meetings.filter(meeting => {
      // Parse duration (ensure it's a number)
      const durationMinutes = Number(meeting.meeting_duration) || 0;
      const endTime = new Date(meeting.meeting_time.getTime() + durationMinutes * 60000);

      return (
        // Either starting in next 5 minutes
        (meeting.meeting_time >= now && meeting.meeting_time <= fiveMinutesLater) ||
        // Or started but not ended
        (meeting.meeting_time <= now && endTime >= now)
      );
    });

    res.status(200).json({
      message: "Upcoming and ongoing meetings fetched successfully",
      data: results,
    });

  } catch (error) {
    console.error("getUpcomingAndOngoingMeetings Error --> ", error);
    res.status(500).json({
      message: "Error fetching meetings",
      error: error.message
    });
  }
}


exports.getOngoingMeetingsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params; // pass courseId in route
    if (!courseId) {
      return res.status(400).json({ success: false, message: "courseId is required" });
    }

    const now = new Date();

    // Step 1: fetch meetings for this course
    const meetings = await Meeting.find({
      course_Ref: courseId,
      isEnded: false,
    }).populate("course_Ref", "courseName");

    // Step 2: filter by ongoing or upcoming (end >= now OR start >= now)
    const activeMeetings = meetings.filter((meeting) => {
      const start = new Date(meeting.meeting_time);
      const end = new Date(start.getTime() + meeting.meeting_duration * 60000);

      return start >= now || (start <= now && end >= now);
    });

    return res.status(200).json({
      success: true,
      count: activeMeetings.length,
      data: activeMeetings,
    });
  } catch (error) {
    console.error("Error fetching ongoing meetings:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching ongoing meetings",
      error: error.message,
    });
  }
};

exports.handleZoomWebhookGet = (req, res) => {
  console.log('Webhook received!');
  console.log('Event:', req.headers['x-zm-event-type']); // The event type header
  console.log('Payload:', JSON.stringify(req.body, null, 2)); // The full event payload

  // IMPORTANT: You must respond with a 200 status code to acknowledge receipt.
  res.status(200).send('Webhook received successfully');
};

// Endpoint for initial webhook validation (Step 4)
exports.handleZoomWebhook = async (req, res) => {
  console.log("Webhook received!");

  var response

  // console.log("one", req.headers)
  // console.log("two", req.body)

  // construct the message string
  const message = `v0:${req.headers['x-zm-request-timestamp']}:${JSON.stringify(req.body)}`

  const hashForVerify = crypto.createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN).update(message).digest('hex')

  // hash the message string with your Webhook Secret Token and prepend the version semantic
  const signature = `v0=${hashForVerify}`
  console.log(signature)
  console.log(req.headers['x-zm-signature'])
  // console.log(req.body)

  // you validating the request came from Zoom https://marketplace.zoom.us/docs/api-reference/webhook-reference#notification-structure
  if (req.headers['x-zm-signature'] === signature) {

    // Zoom validating you control the webhook endpoint https://marketplace.zoom.us/docs/api-reference/webhook-reference#validate-webhook-endpoint
    if (req.body.event === 'endpoint.url_validation') {
      const hashForValidate = crypto.createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN).update(req.body.payload.plainToken).digest('hex')

      response = {
        message: {
          plainToken: req.body.payload.plainToken,
          encryptedToken: hashForValidate
        },
        status: 200
      }

      console.log(response.message)

      res.status(response.status)
      res.json(response.message)
    } else if (req.body.event === 'meeting.deleted') {
      const meetingId = req.body.payload.object.id

      const meeting = await Meeting.findOne({ zoom_meeting_id: meetingId })
      let students = [];
      for (const courseId of meeting.course_Ref) {
        const course = await Course.findById(courseId);
        if (course) {
          students = students.concat(course.student_enrolled);
        }
      }
      let uniqueStudentIds = [...new Set(students.map(id => id))];
      let studentEmails = [];
      for (const studentId of uniqueStudentIds) {
        const student = await User.findById(studentId);
        if (student) {
          const studentNotification = await Notification.create({
            title: `Meeting Cancelled ${meeting.meeting_title}`,
            description: meeting.meeting_agenda,
            time: meeting.meeting_time,
            // image,
            notificationType: "ZOOM MEETING",
            user_ref: student._id,
            read: false
          })
          await studentNotification.save();
          studentEmails.push(student.email);
        }
      }
      meetingCancelledMail(meeting, meeting.host_email, studentEmails);


      await Meeting.findByIdAndDelete({ zoom_meeting_id: meetingId })

      response = { message: 'Meeting deleted from Zoom Webhook sample.', status: 200 }
    } else if (req.body.event === 'meeting.started') {
      const meetingId = req.body.payload.object.id
      const meetingDoc = await Meeting.findOne({ zoom_meeting_id: meetingId })
      const courseIds = meetingDoc.course_Ref
      let students = [];
      for (const courseId of courseIds) {
        const course = await Course.findById(courseId);
        if (course) {
          students = students.concat(course.student_enrolled);
        }
      }
      let uniqueStudentIds = [...new Set(students.map(id => id))];
      let studentEmails = [];
      for (const studentId of uniqueStudentIds) {
        const student = await User.findById(studentId);
        if (student) {
          const studentNotification = await Notification.create({
            title: `Meeting Crea
          ted ${topic}`,
            description: agenda,
            time: startTime,
            // image,
            notificationType: "ZOOM MEETING",
            user_ref: student._id,
            read: false
          })
          await studentNotification.save();
          studentEmails.push(student.email);
        }
      }
      meetingStartedMail(meetingDoc, meetingDoc.host_email, studentEmails);

    } else if (req.body.event === 'meeting.ended') {
      const meetingId = req.body.payload.object.id
      const meetingDoc = await Meeting.findOneAndUpdate({ zoom_meeting_id: meetingId }, { $set: { is_ended: true } }, { new: true })
      console.log(meetingDoc)
    } else {
      response = { message: 'Authorized request to Zoom Webhook sample.', status: 200 }

      console.log(response.message)

      res.status(response.status)
      res.json(response)

      // business logic here, example make API request to Zoom or 3rd party

    }
  } else {

    response = { message: 'Unauthorized request to Zoom Webhook sample.', status: 401 }

    console.log(response.message)

    res.status(response.status)
    res.json(response)
  }
}

exports.toggleIsEndedMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const existingMeeting = await Meeting.findOne({ _id: meetingId });
    if (!existingMeeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }
    const meeting = await Meeting.findOneAndUpdate({ _id: meetingId }, { $set: { isEnded: !existingMeeting.isEnded } }, { new: true })
    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }
    res.status(200).json({ success: true, message: "Meeting ended successfully", data: meeting });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}