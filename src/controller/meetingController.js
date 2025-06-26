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
/* -------------------------------------------------------------------------- */
/*                               Zoom token helper                            */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/*                            createZoomMeeting                               */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/*                          GET /api/meetings  (all)                          */
/* -------------------------------------------------------------------------- */
exports.getAllmeetings = async (req, res) => {
  try {
    // Optional filters ?courseId=…&from=2025-05-01&to=2025-05-31
    const { courseId, from, to } = req.query;
    const filter = {};

    if (courseId) filter.course_Ref = courseId;
    if (from || to) filter.meeting_time = {};
    if (from) filter.meeting_time.$gte = new Date(from);
    if (to) filter.meeting_time.$lte = new Date(to);
    console.log("filter", filter);

    const meetings = await Meeting.find(filter)
      .sort({ meeting_time: 1 }) // ascending
      .populate("course_Ref") // return only course name
      .populate("students") // return each student’s userRef
      .lean();

    res.json(meetings);
  } catch (err) {
    console.error("getAllmeetings ►", err);
    res.status(500).json({ error: "Unable to fetch meetings" });
  }
};

/* -------------------------------------------------------------------------- */
/*                       GET /api/meetings/:id  (single)                      */
/* -------------------------------------------------------------------------- */
exports.getmeetingById = async (req, res) => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findById(id)
      .populate("course_Ref", "name")
      .populate("students", "userRef") // return each student’s userRef
      .lean();

    if (!meeting) return res.status(404).json({ msg: "Meeting not found" });

    res.json(meeting);
  } catch (err) {
    console.error("getmeetingById ►", err);
    res.status(500).json({ error: "Unable to fetch meeting" });
  }
};

/* -------------------------------------------------------------------------- */
/*            GET /api/meetings/student/:studentId  (for one student)         */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*     GET /api/meetings/student/:studentId  → all (or upcoming) meetings     */
/* -------------------------------------------------------------------------- */
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


exports.generateZoomSignature = async (req, res) => {
  try {
    const { meetingNumber, role } = req.body;

    if (!meetingNumber || role === undefined) {
      return res
        .status(400)
        .json({ error: "Missing meetingNumber or role in request body." });
    }

    const sdkKey = process.env.ZOOM_CLIENT_ID;
    const sdkSecret = process.env.ZOOM_CLIENT_SECRET;

    if (!sdkKey || !sdkSecret) {
      return res
        .status(500)
        .json({ error: "Zoom SDK Key and Secret are not configured." });
    }

    const iat = Math.floor(Date.now() / 1000) - 30;
    const exp = iat + 60 * 60 * 2;

    const oHeader = { alg: "HS256", typ: "JWT" };

    const oPayload = {
      sdkKey: sdkKey,
      mn: meetingNumber,
      role: role,
      iat: iat,
      exp: exp,
      // appKey: sdkKey,
      tokenExp: exp,
    };

    const sHeader = JSON.stringify(oHeader);
    const sPayload = JSON.stringify(oPayload);

    const signature = KJUR.jws.JWS.sign("HS256", sHeader, sPayload, sdkSecret);

    res.json({ signature });
  } catch (error) {
    console.error("Error generating Zoom signature:", error);
    res.status(500).json({ error: "Failed to generate Zoom signature." });
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

const zoomAccountId = process.env.ZOOM_ACCOUNT_ID;
const zoomClientId = process.env.ZOOM_CLIENT_ID;
const zoomClientSecret = process.env.ZOOM_CLIENT_SECRET;

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

exports.generateZoomMeeting = async (req, res) => {
  try {
    const zoomAccessToken = await generateZoomAccessToken();

    const response = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        agenda: "Zoom Meeting for YT Demo",
        default_password: false,
        duration: 60,
        password: "12345",
        settings: {
          allow_multiple_devices: true,
          // alternative_hosts: "jayanthbr@digi9.co.in",
          // alternative_hosts_email_notification: true,
          breakout_room: {
            enable: true,
            rooms: [
              {
                name: "room1",
                participants: [
                  "email1@gmail.com",
                  "email2@gmail.com",
                ],
              },
            ],
          },
          calendar_type: 1,
          contact_email: "jayanthbr@digi9.co.in",
          contact_name: "Ajay Sharma",
          email_notification: true,
          encryption_type: "enhanced_encryption",
          focus_mode: true,
          host_video: true,
          join_before_host: true,
          meeting_authentication: true,
          meeting_invitees: [
            {
              email: "jayanthbr@digi9.co.in",
            },
          ],
          mute_upon_entry: true,
          participant_video: true,
          private_meeting: true,
          waiting_room: false,
          watermark: false,
          continuous_meeting_chat: {
            enable: true,
          },
        },
        start_time: new Date().toLocaleDateString(),
        timezone: "Asia/Kolkata",
        topic: "Zoom Meeting for YT Demo",
        type: 2,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${zoomAccessToken}`
        }
      }
    );

    // Access response data with response.data

    const jsonResponse = response.data;

    console.log("generateZoomMeeting JsonResponse --> ", jsonResponse);
    res.status(200).json({
      message: "Zoom meeting created successfully",
      data: jsonResponse,
    });
  } catch (error) {
    console.log("generateZoomMeeting Error --> ", error);
    throw error;
  }
};

exports.getUpcomingAndOngoingMeetings = async (req, res) => {
  try {
    const { courseIds, studentId } = req.body;
    const now = new Date();
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60000);


    // First get all meetings for these courses that might be relevant
    const meetings = await Meeting.find({
      course_Ref: { $in: courseIds },
      students: { $in: [studentId] },
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
    }).populate("course_Ref students");
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
      }
    ).populate("course_Ref students");
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
    const requestBody = coerceRequestBody(req.body)
    const validationErrors = validateRequest(requestBody, propValidations, schemaValidations)

    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors })
    }

    const { meetingNumber, role, expirationSeconds, videoWebRtcMode } = requestBody
    const iat = Math.floor(Date.now() / 1000)
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
      video_webrtc_mode: videoWebRtcMode
    }

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
