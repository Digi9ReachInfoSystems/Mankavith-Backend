const express = require('express');
const router = express.Router();

const TickerController = require('../controller/tickerController');

router.post('/create', TickerController.createTicker);
router.get('/getAllTickers', TickerController.getAllTickers);
router.get('/getTickerById/:id', TickerController.getTickerByid);
router.put('/updateTickerById/:id', TickerController.updateTickerById);
router.delete('/deleteTickerById/:id', TickerController.deleteTickerById);

module.exports = router;