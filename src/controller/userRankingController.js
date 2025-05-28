const UserRanking = require('../model/userRankingModel');
const User = require('../model/user_model');
const mongoose = require('mongoose');
exports.getRankings = async (req, res) => {
  try {
    const rankings = await UserRanking.aggregate([
      { 
        $match: { 
          mockTestId:new  mongoose.Types.ObjectId(req.params.mockTestId),
          subject:new mongoose.Types.ObjectId(req.params.subject)
        } 
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'userattempts',
          localField: 'bestAttemptId',
          foreignField: '_id',
          as: 'bestAttempt'
        }
      },
      { $unwind: '$bestAttempt' },
      {
        $project: {
          // userId: 1,
          userId: '$user',
          bestScore: 1,
          rank: 1,
          attemptsCount: 1,
          userName: '$user.name',
          userEmail: '$user.email',
          submittedAt: '$bestAttempt.submittedAt'
        }
      },
      { $sort: { rank: 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: rankings
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get user's ranking for a test in a specific course (updated)
exports.getUserRanking = async (req, res) => {
  try {
    const ranking = await UserRanking.findOne({
      userId:  new mongoose.Types.ObjectId(req.params.user_id), //req.params.user_id,
      mockTestId: new mongoose.Types.ObjectId(req.params.mockTestId), // req.params.mockTestId,
      subject:  new mongoose.Types.ObjectId(req.params.subject), 
    }).populate('subject');
    
    if (!ranking) {
      return res.status(404).json({
        success: false,
        message: 'Ranking not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: ranking
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};