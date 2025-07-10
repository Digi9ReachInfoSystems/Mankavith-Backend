const express = require("express");
const router = express.Router();
const couponController = require("../controller/couponController");


router.post("/create", couponController.createCoupon);

router.put("/update/:id", couponController.updateCoupon);

router.delete("/delete/:id", couponController.deleteCoupon);

router.get("/all", couponController.getAllCoupons);

router.get("/getById/:id", couponController.getCouponById);

router.get("/user/:userId", couponController.getCouponsByUserId);

router.post("/validate", couponController.validateCoupon);

router.put("/activateOrDeactivate/:id", couponController.activateOrDeactivateCoupon);

router.delete("/bulk/delete", couponController.bulkDeleteCoupons);

module.exports = router;
