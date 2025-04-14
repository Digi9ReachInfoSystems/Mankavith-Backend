const express = require('express');
const router = express.Router();

const TestimonialsController = require('../controller/testimonialsController');


router.post('/create', TestimonialsController.createTestimonials);
router.get('/getAllTestimonials', TestimonialsController.getAllTestimonials);
router.get('/getTestimonialsById/:id', TestimonialsController.getTestimonialsById);
router.put('/updateTestimonialsById/:id', TestimonialsController.updateTestimonialsById);
router.delete('/deleteTestimonialsById/:id', TestimonialsController.deleteTestimonialsById);

module.exports = router;