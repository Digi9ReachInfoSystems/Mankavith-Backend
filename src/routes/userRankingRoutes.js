const express = require('express');
const router = express.Router();
const rankingController = require('../controller/userRankingController');


router.get('/:mockTestId/:subject', rankingController.getRankings);
router.get('/get/user/:mockTestId/:user_id/:subject',rankingController.getUserRanking);

module.exports = router;