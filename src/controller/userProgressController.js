const UserProgress = require("../model/userProgressModel");
const CourseProgress = require("../model/courseProgressModel");
const Course = require("../model/course_model");
const Subject = require("../model/subject_model");
const { generateCertificate } = require("../utils/certificateGenerationService");
const User = require("../model/user_model");
const Certificate = require("../model/certificatesModel");


exports.startCourse = async (req, res) => {
    try {
        const { user_id, course_id } = req.body;

        let userProgress = await UserProgress.findOne({ user_id: user_id });
        let courseProgress = await CourseProgress.findOne({ course_id: course_id });

        if (!userProgress) {

            userProgress = new UserProgress({
                user_id, courseProgress: [{
                    course_id,
                    viewedCertificate: false,
                    status: "ongoing",
                    startedAt: new Date(),
                    completedAt: new Date(),
                }]
            });
        }


        if (!courseProgress) {
            courseProgress = new CourseProgress({ course_id, progress: [] });
        }


        const course = userProgress.courseProgress.find(
            (cp) => cp.course_id.equals(course_id)
        );

        if (!course) {
            userProgress.courseProgress.push({
                course_id,
                status: "ongoing",
                startedAt: new Date(),
                completedAt: 0,
            });
        }
        // else {
        //   module.status = 'ongoing';
        //   module.startedAt = new Date();
        // }

        await userProgress.save();
        const user = await courseProgress.progress.find(
            (item) => item.user_id.equals(user_id)
        );
        if (!user) {
            courseProgress.progress.push({
                user_id,
                status: 'ongoing',
                startedAt: new Date(),
                completedAt: null,
            })
        }

        await courseProgress.save();

        res.status(200).json({ message: "Module started successfully", userProgress: userProgress, courseProgress: courseProgress });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error starting module", error: error.message });
    }
};

exports.startSubject = async (req, res) => {
    try {
        const { user_id, subject_id, course_id } = req.body;

        let userProgress = await UserProgress.findOne({ user_id: user_id });
        let courseProgress = await CourseProgress.findOne({ course_id: course_id });

        if (!userProgress) {
            return res.status(404).json({ message: "User Progress not found" });
        }


        if (!courseProgress) {
            return res.status(404).json({ message: "Course Progress not found" });
        }


        const course = userProgress.courseProgress.find(
            (cp) => cp.course_id.equals(course_id)
        );

        if (!course) {
            res.status(404).json({ message: "Course not found" });
        }
        const subject = course.subjectProgress.find(
            (cp) => cp.subject_id.equals(subject_id)
        )
        if (!subject) {
            course.subjectProgress.push({
                subject_id,
                status: "ongoing",
                startedAt: new Date(),
                completedAt: null,
            });
        }
        // else {
        //   module.status = 'ongoing';
        //   module.startedAt = new Date();
        // }

        await userProgress.save();
        const user = await courseProgress.progress.find(
            (item) => item.user_id.equals(user_id)
        );
        if (!user) {
            return res.status(404).json({ message: "user not found" });
        }
        const userSubject = user.subjectProgress.find(
            (cp) => cp.subject_id.equals(subject_id)
        )
        if (!userSubject) {
            user.subjectProgress.push({
                subject_id,
                status: "ongoing",
                startedAt: new Date(),
                completedAt: null,
            })
        }

        await courseProgress.save();

        res.status(200).json({ message: "Module started successfully", userProgress: userProgress, courseProgress: courseProgress });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error starting module", error: error.message });
    }
};
exports.startLecturer = async (req, res) => {
    try {
        const { user_id, lecturer_id, course_id, subject_id } = req.body;

        let userProgress = await UserProgress.findOne({ user_id: user_id });
        let courseProgress = await CourseProgress.findOne({ course_id: course_id });

        if (!userProgress) {
            return res.status(404).json({ message: "User Progress not found" });
        }


        if (!courseProgress) {
            return res.status(404).json({ message: "Course Progress not found" });
        }


        const course = userProgress.courseProgress.find(
            (cp) => cp.course_id.equals(course_id)
        );

        if (!course) {
            res.status(404).json({ message: "Course not found" });
        }
        const subject = course.subjectProgress.find(
            (cp) => cp.subject_id.equals(subject_id)
        )
        if (!subject) {
            return res.status(404).json({ message: "Subject not found" });
        }
        const lecturer = subject.lecturerProgress.find(
            (cp) => cp.lecturer_id.equals(lecturer_id)
        )
        if (!lecturer) {
            subject.lecturerProgress.push({
                lecturer_id,
                status: "ongoing",
                startedAt: new Date(),
                completedAt: null,
            });
        }
        // else {
        //   module.status = 'ongoing';
        //   module.startedAt = new Date();
        // }

        await userProgress.save();

        const user = await courseProgress.progress.find(
            (item) => item.user_id.equals(user_id)
        );
        if (!user) {
            return res.status(404).json({ message: "user not found" });
        }
        const userSubject = user.subjectProgress.find(
            (cp) => cp.subject_id.equals(subject_id)
        )
        const userLecturer = userSubject.lecturerProgress.find(
            (cp) => cp.lecturer_id.equals(lecturer_id)
        )
        if (!userLecturer) {
            userSubject.lecturerProgress.push({
                lecturer_id,
                status: "ongoing",
                startedAt: new Date(),
                completedAt: null,
            })
        }

        await courseProgress.save();

        res.status(200).json({ message: "Module started successfully", userProgress: userProgress, courseProgress: courseProgress });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error starting module", error: error.message });
    }

};

exports.completeCourse = async (req, res) => {
    try {
        const { user_id, course_id } = req.body;

        let userProgress = await UserProgress.findOne({ user_id: user_id });
        let courseProgress = await CourseProgress.findOne({ course_id: course_id });

        if (!userProgress) {
            return res.status(404).json({ message: "User Progress not found" });
        }

        if (!courseProgress) {
            return res.status(404).json({ message: "Course Progress not found" });
        }

        const course = userProgress.courseProgress.find(
            (cp) => cp.course_id.equals(course_id)
        );

        if (!course) {
            res.status(404).json({ message: "Course not found" });
        }
        const mainCourse = await Course.findById(course_id);
        const totalSubjects = mainCourse.subjects.length > 0 ? mainCourse.subjects.length : 0;
        const completedSubjects = course.subjectProgress.filter((subject) => subject.status === "completed");
        const totalCompletedSubjects = completedSubjects.length > 0 ? completedSubjects.length : 0;

        course.status = Number((totalCompletedSubjects / totalSubjects) * 100).toFixed(2) == 100 ? "completed" : "ongoing";
        course.completedAt = Number((totalCompletedSubjects / totalSubjects) * 100).toFixed(2) == 100 ? new Date() : null;
        course.completedPercentage = totalSubjects == 0 ? 0 : Number((totalCompletedSubjects / totalSubjects) * 100).toFixed(2);
        await userProgress.save();
        const user = await courseProgress.progress.find(
            (item) => item.user_id.equals(user_id)
        );
        if (!user) {
            return res.status(404).json({ message: "user not found" });
        }

        user.status = Number((totalCompletedSubjects / totalSubjects) * 100).toFixed(2) == 100 ? "completed" : "ongoing";
        user.completedAt = Number((totalCompletedSubjects / totalSubjects) * 100).toFixed(2) == 100 ? new Date() : null;
        user.completedPercentage = totalSubjects == 0 ? 0 : Number((totalCompletedSubjects / totalSubjects) * 100).toFixed(2);
        await courseProgress.save();

        res.status(200).json({ message: "Course completed successfully", userProgress: userProgress, courseProgress: courseProgress });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error completing course", error: error.message });
    }

};
exports.completeSubject = async (req, res) => {
    try {
        const { user_id, subject_id, course_id } = req.body;

        let userProgress = await UserProgress.findOne({ user_id: user_id });
        let courseProgress = await CourseProgress.findOne({ course_id: course_id });

        if (!userProgress) {
            return res.status(404).json({ message: "User Progress not found" });
        }

        if (!courseProgress) {
            return res.status(404).json({ message: "Course Progress not found" });
        }

        const course = userProgress.courseProgress.find(
            (cp) => cp.course_id.equals(course_id)
        );

        if (!course) {
            res.status(404).json({ message: "Course not found" });
        }

        const subject = course.subjectProgress.find(
            (cp) => cp.subject_id.equals(subject_id)
        );

        if (!subject) {
            res.status(404).json({ message: "Subject not found" });
        }
        const mainSubjects = await Subject.findById(subject_id);
        const totalLectures = mainSubjects.lectures.length;
        const completedLecturer = subject.lecturerProgress.filter((lecturer) => lecturer.status === "completed");
        const totalCompletedLecturer = completedLecturer.length;


        subject.status = Number((totalCompletedLecturer / totalLectures) * 100).toFixed(2) == 100 ? "completed" : "ongoing";
        subject.completedAt = Number((totalCompletedLecturer / totalLectures) * 100).toFixed(2) == 100 ? new Date() : null;
        subject.completedPercentage = totalLectures == 0 ? 0.0 : Number((totalCompletedLecturer / totalLectures) * 100).toFixed(2);

        await userProgress.save();

        const mainCourse = await Course.findById(course_id);
        const totalSubjects = mainCourse.subjects.length > 0 ? mainCourse.subjects.length : 0;
        const completedSubjects = course.subjectProgress.filter((subject) => subject.status === "completed");
        const totalCompletedSubjects = completedSubjects.length > 0 ? completedSubjects.length : 0;


        course.status = Number((totalCompletedSubjects / totalSubjects) * 100).toFixed(2) === 100 ? "completed" : "ongoing";
        course.completedAt = Number((totalCompletedSubjects / totalSubjects) * 100).toFixed(2) === 100 ? new Date() : null;
        course.completedPercentage = totalSubjects == 0 ? 0.0 : Number((totalCompletedSubjects / totalSubjects) * 100).toFixed(2);
        await userProgress.save();
        const user = await courseProgress.progress.find(
            (item) => item.user_id.equals(user_id)
        );
        if (!user) {
            return res.status(404).json({ message: "user not found" });
        }
        const userSubject = user.subjectProgress.find(
            (cp) => cp.subject_id.equals(subject_id)
        )
        if (!userSubject) {
            return res.status(404).json({ message: "Subject not found" });
        }
        userSubject.status = Number((totalCompletedLecturer / totalLectures) * 100).toFixed(2) === 100 ? "completed" : "ongoing";
        userSubject.completedAt = Number((totalCompletedLecturer / totalLectures) * 100).toFixed(2) === 100 ? new Date() : null;
        userSubject.completedPercentage = totalLectures == 0 ? 0.0 : Number((totalCompletedLecturer / totalLectures) * 100).toFixed(2);

        await courseProgress.save();

        user.status = Number((totalCompletedSubjects / totalSubjects) * 100).toFixed(2) == 100 ? "completed" : "ongoing";
        user.completedAt = Number((totalCompletedSubjects / totalSubjects) * 100).toFixed(2) == 100 ? new Date() : null;
        user.completedPercentage = totalSubjects == 0 ? 0.0 : Number((totalCompletedSubjects / totalSubjects) * 100).toFixed(2);

        await courseProgress.save();


        res.status(200).json({ message: "Subject completed successfully", userProgress: userProgress, courseProgress: courseProgress });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error completing subject", error: error.message });
    }

};

exports.completeLecturer = async (req, res) => {
    try {
        const { user_id, lecturer_id, subject_id, course_id } = req.body;
        const userData = await User.findById(user_id);
        if (!userData) {
            return res.status(404).json({ message: "User not found" });
        } 
        const courseData = await Course.findById(course_id);
        if (!courseData) {
            return res.status(404).json({ message: "Course not found" });   
        }

        let userProgress = await UserProgress.findOne({ user_id: user_id });
        let courseProgress = await CourseProgress.findOne({ course_id: course_id });

        if (!userProgress) {
            return res.status(404).json({ message: "User Progress not found" });
        }

        if (!courseProgress) {
            return res.status(404).json({ message: "Course Progress not found" });
        }

        const course = userProgress.courseProgress.find(
            (cp) => cp.course_id.equals(course_id)
        );

        if (!course) {
            res.status(404).json({ message: "Course not found" });
        }

        const subject = course.subjectProgress.find(
            (cp) => cp.subject_id.equals(subject_id)
        );

        if (!subject) {
            res.status(404).json({ message: "Subject not found" });
        }
        const lecturer = subject.lecturerProgress.find(
            (cp) => cp.lecturer_id.equals(lecturer_id)
        );

        if (!lecturer) {
            res.status(404).json({ message: "Lecturer not found" });
        }
        lecturer.status = "completed";
        lecturer.completedAt = new Date();
        await userProgress.save();
        if(userProgress.status === "completed" ) {
            return res.status(200).json({ message: "Lecturer completed successfully", userProgress: userProgress, courseProgress: courseProgress });
        }

        const mainSubjects = await Subject.findById(subject_id);
        const totalLectures = mainSubjects.lectures.length > 0 ? mainSubjects.lectures.length : 0;
        const completedLecturer = subject.lecturerProgress.filter((lecturer) => lecturer.status === "completed");
        const totalCompletedLecturer = completedLecturer.length > 0 ? completedLecturer.length : 0;
        await userProgress.save();
       
        subject.status = Number((totalCompletedLecturer / totalLectures) * 100).toFixed(2) == 100 ? "completed" : "ongoing";
        subject.completedAt = Number((totalCompletedLecturer / totalLectures) * 100).toFixed(2) == 100 ? new Date() : null;
        subject.completedPercentage = totalLectures == 0 ? 0.0 : Number((totalCompletedLecturer / totalLectures) * 100).toFixed(2);

        const mainCourse = await Course.findById(course_id)
        .populate("subjects");
        const subjectsWithLectures = mainCourse.subjects.filter((subject) => {
            console.log("subject", subject);
            // subject?.lectures?.length > 0
            if(subject?.lectures){
                if (subject.lectures.length > 0) {
                    return true;
                }
            }else{
                return false;
            }
        });
        console.log("subjectsWithLectures", subjectsWithLectures);
        // const totalSubjects = mainCourse.subjects.length > 0 ? mainCourse.subjects.length : 0;
        const totalSubjects = subjectsWithLectures.length > 0 ? subjectsWithLectures.length : 0;
        const completedSubjects = course.subjectProgress.filter((subject) => subject.status == "completed");
        const totalCompletedSubjects = completedSubjects.length > 0 ? completedSubjects.length : 0;
        await userProgress.save();

        course.status = Number((totalCompletedSubjects / totalSubjects) * 100).toFixed(2) == 100 ? "completed" : "ongoing";
        course.completedAt = Number((totalCompletedSubjects / totalSubjects) * 100).toFixed(2) == 100 ? new Date() : null;
        course.completedPercentage = totalSubjects == 0 ? 0.0 : Number((totalCompletedSubjects / totalSubjects) * 100).toFixed(2);
         if( course.completedPercentage == 100&&(!course.generatedCertificate)){
            // logic to generate certificate
            const urls= await generateCertificate(userData.displayName, courseData.courseDisplayName);
            course.generatedCertificate = true;
            const certificate = new Certificate({
                user_ref: user_id,
                course_ref: course_id,
                certificate_url: urls.pdfUrl,
            });
            await certificate.save();
        }
        await userProgress.save();

        const user = await courseProgress.progress.find(
            (item) => item.user_id.equals(user_id)
        );
        if (!user) {
            return res.status(404).json({ message: "user not found" });
        }
        const userSubject = user.subjectProgress.find(
            (cp) => cp.subject_id.equals(subject_id)
        )
        if (!userSubject) {
            return res.status(404).json({ message: "Subject not found" });
        }
        const userLecturer = userSubject.lecturerProgress.find(
            (cp) => cp.lecturer_id.equals(lecturer_id)
        )
        if (!userLecturer) {
            return res.status(404).json({ message: "Lecturer not found" });
        }
        userLecturer.status = "completed";
        userLecturer.completedAt = new Date();
        userLecturer.completedPercentage = totalLectures === 0 ? 0.0 : Number((totalCompletedLecturer / totalLectures) * 100).toFixed(2);

        userSubject.status = Number((totalCompletedLecturer / totalLectures) * 100).toFixed(2) == 100 ? "completed" : "ongoing";
        userSubject.completedAt = Number((totalCompletedLecturer / totalLectures) * 100).toFixed(2) == 100 ? new Date() : null;
        userSubject.completedPercentage = totalLectures == 0 ? 0.0 : Number((totalCompletedLecturer / totalLectures) * 100).toFixed(2);
        user.status = Number((totalCompletedSubjects / totalSubjects) * 100).toFixed(2) == 100 ? "completed" : "ongoing";
        user.completedAt = Number((totalCompletedSubjects / totalSubjects) * 100).toFixed(2) == 100 ? new Date() : null;
        user.completedPercentage = totalSubjects == 0 ? 0.0 : Number((totalCompletedSubjects / totalSubjects) * 100).toFixed(2);
        await courseProgress.save();

        res.status(200).json({ message: "Lecturer completed successfully", userProgress: userProgress, courseProgress: courseProgress });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error completing lecturer", error: error.message });
    }

};
exports.updateViewedCertificate = async (req, res) => {
    try {
        const { user_id, course_id } = req.body;

        let userProgress = await UserProgress.findOne({ user_id: user_id });
        if (!userProgress) {
            return res.status(404).json({ message: "User Progress not found" });
        }

        const course = userProgress.courseProgress.find(
            (cp) => cp.course_id.equals(course_id)
        );
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        course.viewedCertificate = true;
       const data= await userProgress.save();
        res.status(200).json({ message: "Certificate viewed successfully", userProgress: data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error viewing certificate", error: error.message });
    }
};
