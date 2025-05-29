const UserAttempt = require('../model/userAttemptModel');
const MockTest = require('../model/mockTestModel');
const UserRanking = require('../model/userRankingModel');

// Start a new attempt (updated)
// exports.startAttempt = async (req, res) => {
//     try {
//         const { mockTestId, courseId, user_id } = req.body;

//         // Check attempt count for this course
//         const attemptCount = await UserAttempt.countDocuments({
//             userId: user_id,
//             mockTestId,
//             courseId
//         });

//         if (attemptCount >= 3) {
//             return res.status(200).json({
//                 success: false,
//                 message: 'Maximum attempts reached for this course'
//             });
//         }

//         const mockTest = await MockTest.findById(mockTestId);
//         if (!mockTest) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Test not found'
//             });
//         }

//         // Initialize answers array
//         const answers = mockTest.questions.map(question => ({
//             questionId: question._id,
//             answer: '',
//             isCorrect: false,
//             marksAwarded: 0
//         }));

//         const attempt = new UserAttempt({
//             userId: user_id,
//             mockTestId,
//             courseId, // Include course ID
//             attemptNumber: attemptCount + 1,
//             answers,
//             status: 'in-progress'
//         });

//         await attempt.save();

//         res.status(201).json({
//             success: true,
//             data: attempt
//         });
//     } catch (err) {
//         res.status(500).json({
//             success: false,
//             message: err.message
//         });
//     }
// };
exports.startAttempt = async (req, res) => {
    try {
        const { mockTestId, subject, user_id } = req.body;

        const attemptCount = await UserAttempt.countDocuments({
            userId: user_id,
            mockTestId,
            subject
        });



        const mockTest = await MockTest.findById(mockTestId);
        if (!mockTest) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }
        if (attemptCount >= mockTest.maxAttempts) {
            return res.status(200).json({
                success: false,
                message: 'Maximum attempts reached for this course'
            });
        }

        const now = new Date();
        const isWithinWindow = now >= new Date(mockTest.startDate) && now <= new Date(mockTest.endDate);

        // Initialize answers array
        const answers = mockTest.questions.map(question => ({
            questionId: question._id,
            answer: null,
            answerIndex: null, // For MCQ
            isCorrect: false,
            marksAwarded: 0
        }));

        const attempt = new UserAttempt({
            userId: user_id,
            mockTestId,
            subject,
            attemptNumber: attemptCount + 1,
            answers,
            status: 'in-progress',
            isWithinTestWindow: isWithinWindow // Set based on current time
        });

        await attempt.save();

        res.status(201).json({
            success: true,
            data: attempt,
            message: isWithinWindow ?
                'Attempt started (will count for rankings)' :
                'Attempt started (will NOT count for rankings)'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Save an answer
exports.saveAnswer = async (req, res) => {
    try {
        const { attemptId, questionId, answer, user_id, userAnswerIndex } = req.body;

        const attempt = await UserAttempt.findOne({
            _id: attemptId,
            userId: user_id,
            status: 'in-progress'
        });

        if (!attempt) {
            return res.status(404).json({
                success: false,
                message: 'Attempt not found or already submitted'
            });
        }

        const mockTest = await MockTest.findById(attempt.mockTestId);
        const question = mockTest.questions.id(questionId);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        // Find and update the answer
        const answerIndex = attempt.answers.findIndex(a =>
            a.questionId.equals(questionId)
        );

        if (answerIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Answer not found'
            });
        }

        // For MCQ, check correctness immediately
        let isCorrect = false;
        if (question.type === 'mcq') {
            isCorrect = question.correctAnswer === userAnswerIndex;
        }

        attempt.answers[answerIndex] = {
            questionId,
            answer,
            answerIndex: question.type === 'mcq' ? userAnswerIndex : null,
            isCorrect,
            marksAwarded: question.type === 'mcq' ? (isCorrect ? question.marks : question.options[userAnswerIndex].marks) : 0,

        };

        await attempt.save();

        res.status(200).json({
            success: true,
            data: attempt.answers[answerIndex]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Submit attempt (updated)
exports.submitAttempt = async (req, res) => {
    try {
        const { attemptId, user_id } = req.body;

        const attempt = await UserAttempt.findOne({
            _id: attemptId,
            userId: user_id,
            status: 'in-progress'
        }).populate('mockTestId');

        if (!attempt) {
            return res.status(404).json({
                success: false,
                message: 'Attempt not found or already submitted'
            });
        }

        const now = new Date();
        const isWithinWindow = attempt.isWithinTestWindow;

        const mockTest = await MockTest.findById(attempt.mockTestId);

        // Calculate MCQ score
        let mcqScore = 0;
        attempt.answers = attempt.answers.map(answer => {
            const question = mockTest.questions.id(answer.questionId);

            if (question.type === 'mcq') {
                const isCorrect = question.correctAnswer === answer.answerIndex;
                const marks = isCorrect ? question.marks : question.options[answer.answerIndex].marks;
                mcqScore += marks;

                return {
                    ...answer.toObject(),
                    isCorrect,
                    marksAwarded: marks
                };
            }
            return answer;
        });

        attempt.mcqScore = mcqScore;
        attempt.submittedAt = new Date();

        // Check if test has subjective questions
        const hasSubjective = mockTest.questions.some(q => q.type === 'subjective');

        if (hasSubjective) {
            attempt.status = 'submitted';
            attempt.totalMarks = mcqScore;
        } else {
            attempt.status = 'evaluated';
            attempt.evaluatedAt = new Date();
            attempt.totalMarks = mcqScore;
        }

        await attempt.save();

        // If no subjective questions, update rankings immediately
        if (isWithinWindow) {
            if (!hasSubjective) {
                await updateRankings(attempt);
            }
        }


        res.status(200).json({
            success: true,
            data: attempt,
            message: isWithinWindow ?
                'Attempt submitted (counts for rankings)' :
                'Attempt submitted (does NOT count for rankings)'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Admin: Evaluate subjective answers
exports.evaluateSubjective = async (req, res) => {
    try {
        const { attemptId, evaluations } = req.body;

        const attempt = await UserAttempt.findById(attemptId).populate('mockTestId');
        if (!attempt) {
            return res.status(404).json({
                success: false,
                message: 'Attempt not found'
            });
        }

        if (attempt.status !== 'submitted') {
            return res.status(400).json({
                success: false,
                message: 'Attempt is not ready for evaluation'
            });
        }

        const mockTest = await MockTest.findById(attempt.mockTestId._id);
        const now = new Date();
        const isWithinWindow = attempt.isWithinTestWindow;


        let subjectiveScore = 0;

        // Process each evaluation
        attempt.answers = attempt.answers.map(answer => {
            const question = mockTest.questions.id(answer.questionId);

            if (question.type === 'subjective') {
                const evaluation = evaluations.find(e => {
                    return answer.questionId.equals(e.questionId)
                }
                );

                if (evaluation) {
                    subjectiveScore += evaluation.marks;
                    return {
                        ...answer.toObject(),
                        marksAwarded: evaluation.marks,
                        isCorrect: evaluation.isCorrect
                    };
                }
            }
            return answer;
        });

        attempt.subjectiveScore = subjectiveScore;
        attempt.totalMarks = attempt.mcqScore + subjectiveScore;
        attempt.status = 'evaluated';
        attempt.evaluatedAt = new Date();

        await attempt.save();
        if (isWithinWindow) {
            await updateRankings(attempt);

        }

        res.status(200).json({
            success: true,
            data: attempt
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Get attempt details
exports.getAttempt = async (req, res) => {
    try {
        const { user_id, id } = req.params;
        if (!user_id, !id) {
            return res.status(400).json({ success: false, message: "Missing user_id and attempt_id" });
        }
        let attempt = await UserAttempt.findOne({
            _id: req.params.id,
            userId: req.params.user_id
        }).populate('mockTestId');
        const attemptObj = attempt.toObject();

        attemptObj.answers = attemptObj.answers.map(answer => {

            const isSubmitted = answer.questionId.type === 'mcq'
                ? answer.answerIndex !== null && answer.answerIndex !== undefined
                : answer.answer !== null && answer.answer !== '' && answer.answer !== undefined;

            return {
                ...answer,
                answerSubmitted: isSubmitted
            };
        });

        attempt = attemptObj;
        if (!attempt) {
            return res.status(404).json({
                success: false,
                message: 'Attempt not found'
            });
        }


        res.status(200).json({
            success: true,
            data: attempt
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Get all attempts for a user and test
exports.getUserAttempts = async (req, res) => {
    try {
        if (!req.params.user_id || !req.params.mockTestId) {
            return res.status(400).json({ success: false, message: "Missing user_id and mockTestId" });
        }
        const attempts = await UserAttempt.find({
            userId: req.params.user_id,
            mockTestId: req.params.mockTestId
        }).sort({ attemptNumber: 1 });

        res.status(200).json({
            success: true,
            data: attempts
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Helper function to update rankings (updated)
async function updateRankings(attempt) {
    // Get all evaluated attempts for this user, test, and course
    const attempts = await UserAttempt.find({
        userId: attempt.userId,
        mockTestId: attempt.mockTestId,
        courseId: attempt.courseId,
        status: 'evaluated',
        isWithinTestWindow: true
    });

    // Find best attempt (highest score, earliest submission for ties)
    let bestAttempt = attempts.reduce((best, current) => {
        if (current.totalMarks > best.totalMarks) return current;
        if (current.totalMarks === best.totalMarks &&
            current.submittedAt < best.submittedAt) return current;
        return best;
    }, attempts[0]);

    // Update all attempts to mark which is best
    await UserAttempt.updateMany(
        {
            userId: attempt.userId,
            mockTestId: attempt.mockTestId,
            courseId: attempt.courseId
        },
        { $set: { isBestAttempt: false } }
    );

    bestAttempt.isBestAttempt = true;
    await bestAttempt.save();

    // Update or create ranking
    const ranking = await UserRanking.findOneAndUpdate(
        {
            userId: attempt.userId,
            mockTestId: attempt.mockTestId,
            subject: attempt.subject
        },
        {
            bestAttemptId: bestAttempt._id,
            bestScore: bestAttempt.totalMarks,
            attemptsCount: attempts.length,
            lastUpdated: new Date()
        },
        { upsert: true, new: true }
    );

    // Recalculate all rankings for this test and course
    await recalculateTestRankings(attempt.mockTestId, attempt.subject);
}

async function recalculateTestRankings(mockTestId, subject) {
    const rankings = await UserRanking.find({
        mockTestId,
        subject
    }).sort({ bestScore: -1, lastUpdated: 1 });

    let currentRank = 1;
    for (let i = 0; i < rankings.length; i++) {
        // Same rank for same scores
        if (i > 0 && rankings[i].bestScore === rankings[i - 1].bestScore) {
            rankings[i].rank = rankings[i - 1].rank;
        } else {
            rankings[i].rank = currentRank;
        }
        currentRank++;

        await rankings[i].save();
    }
}

async function recalculateTestRankings(mockTestId) {
    const rankings = await UserRanking.find({ mockTestId })
        .sort({ bestScore: -1, lastUpdated: 1 });

    let currentRank = 1;
    for (let i = 0; i < rankings.length; i++) {
        // Same rank for same scores
        if (i > 0 && rankings[i].bestScore === rankings[i - 1].bestScore) {
            rankings[i].rank = rankings[i - 1].rank;
        } else {
            rankings[i].rank = currentRank;
        }
        currentRank++;

        await rankings[i].save();
    }
}

exports.getSubmittedUsersByMockTest = async (req, res) => {
    try {
        const { mockTestId } = req.params;
        const { status } = req.query;
        let query = { mockTestId };
        if (status) {
            query.status = status; // Filter by status if provided
        }

        // First, get all submitted attempts for this mock test
        let attempts = await UserAttempt.find(query)
            .populate('userId')
            .populate({
                path: 'mockTestId',
                select: 'questions' // get the questions from mock test
            });

        attempts = attempts.map(attempt => {
            const questions = attempt.mockTestId.questions;
            const answersWithQuestions = attempt.answers.map(answer => {
                const question = questions.find(q => q._id.equals(answer.questionId));
                return {
                    ...answer.toObject(),
                    questionDetails: question
                };
            });
            return {
                ...attempt.toObject(),
                answers: answersWithQuestions
            };
        });

        if (!attempts || attempts.length === 0) {
            return res.status(404).json({ message: 'No submitted attempts found for this mock test' });
        }

        // Group attempts by user
        const usersMap = new Map();

        attempts.forEach(attempt => {
            const userId = attempt.userId._id.toString();

            if (!usersMap.has(userId)) {
                usersMap.set(userId, {
                    user: attempt.userId,
                    attempts: [],
                    bestAttempt: null,
                    highestScore: 0
                });
            }

            const userData = usersMap.get(userId);
            userData.attempts.push(attempt);

            // Track best attempt (highest score)
            if (attempt.totalMarks > userData.highestScore) {
                userData.highestScore = attempt.totalMarks;
                userData.bestAttempt = attempt;
            }
        });

        // Convert map to array of user objects
        const users = Array.from(usersMap.values());

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });

    } catch (error) {
        console.error('Error fetching submitted users:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching submitted users',
            error: error.message
        });
    }
};