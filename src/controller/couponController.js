const Coupon = require("../model/couponModel");
const mongoose = require("mongoose");


exports.createCoupon = async (req, res) => {
    try {
        const {
            coupon_name,
            coupon_des,
            start_date,
            end_date,
            discount_amount,
            coupon_image,
            coupon_type,
            user_list,
            coupon_code,
        } = req.body;
        const existingCoupon = await Coupon.findOne({ coupon_code: coupon_code });
        if (existingCoupon) {
            return res.status(400).json({ success: false, message: "Coupon code already exists" });
        }

        const newCoupon = new Coupon({
            coupon_name,
            coupon_des,
            start_date: start_date || Date.now(),
            end_date,
            discount_amount,
            coupon_image,
            coupon_type,
            user_list,
            coupon_code,
        });

        await newCoupon.save();
        res.status(201).json({ success: true, message: "Coupon created successfully", coupon: newCoupon });
    } catch (error) {
        console.error("Create Coupon Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};


exports.updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            coupon_name,
            coupon_des,
            start_date,
            end_date,
            discount_amount,
            coupon_image,
            coupon_type,
            user_list,
            coupon_code,
        } = req.body;
        const existingCouponCode = await Coupon.findOne({ coupon_code: coupon_code });
        if (existingCouponCode && id !== existingCouponCode._id.toString()) {
            return res.status(400).json({ success: false, message: "Coupon code already exists for another coupon" });
        }
        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        const updatedCoupon = await Coupon.findByIdAndUpdate(
            id,
            {
                coupon_name: coupon_name || coupon.coupon_name,
                coupon_des: coupon_des || coupon.coupon_des,
                start_date: start_date || coupon.start_date,
                end_date: end_date || coupon.end_date,
                discount_amount: discount_amount || coupon.discount_amount,
                coupon_image: coupon_image || coupon.coupon_image,
                coupon_type: coupon_type || coupon.coupon_type,
                user_list: coupon_type === "All" ? [] : user_list || coupon.user_list,
                coupon_code: coupon.coupon_code,
            },
            { new: true, runValidators: true }
        );

        if (!updatedCoupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        res.status(200).json({ success: true, message: "Coupon updated successfully", coupon: updatedCoupon });
    } catch (error) {
        console.error("Edit Coupon Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};


exports.deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedCoupon = await Coupon.findByIdAndDelete(id);

        if (!deletedCoupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        res.status(200).json({ success: true, message: "Coupon deleted successfully" });
    } catch (error) {
        console.error("Delete Coupon Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};


exports.getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().populate("user_list applied_users");
        res.status(200).json({ success: true, coupons });
    } catch (error) {
        console.error("Get All Coupons Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};


exports.getCouponById = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findById(id).populate("user_list applied_users");

        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        res.status(200).json({ success: true, coupon });
    } catch (error) {
        console.error("Get Coupon By ID Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};


exports.getCouponsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        const coupons = await Coupon.find({
            $and: [
                {
                    $or: [
                        { coupon_type: "All" },
                        { user_list: userId }
                    ]
                },
                { applied_users: { $nin: [userId] } },
                { is_active: true },
                { end_date: { $gte: new Date() } }
            ]
        });

        res.status(200).json({ success: true, coupons });
    } catch (error) {
        console.error("Get Coupons By User ID Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};


exports.validateCoupon = async (req, res) => {
    try {
        const { userId, couponCode } = req.body;
console.log(req.body);
        if (!userId || !couponCode) {
            return res.status(400).json({ success: false, message: "User ID and Coupon Code are required" });
        }

        const coupon = await Coupon.findOne({ coupon_code: couponCode });

        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }
        if (!coupon.is_active) {
            return res.status(400).json({ success: false, message: "Coupon is not active" });
        }

        const now = new Date();
        if (now < coupon.start_date || now > coupon.end_date) {
            return res.status(400).json({ success: false, message: "Coupon is not valid at this time" });
        }

        if (coupon.applied_users.includes(userId)) {
            return res.status(400).json({ success: false, message: "Coupon already used by this user" });
        }

        if (["Selected users"].includes(coupon.coupon_type)) {
            const isEligible = coupon.user_list.some(user => user.toString() === userId);
            if (!isEligible) {
                return res.status(400).json({ success: false, message: "You are not eligible for this coupon" });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Coupon is valid",
            discount: coupon.discount_amount,
            couponId: coupon._id
        });

    } catch (err) {
        console.error("Validate Coupon Error:", err);
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

exports.activateOrDeactivateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findById(id);

        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        coupon.is_active = !coupon.is_active;
        await coupon.save();

        res.status(200).json({ success: true, message: `Coupon ${coupon.is_active ? "  activated" : " deactivated"} successfully` });
    } catch (error) {
        console.error("Activate/Deactivate Coupon Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

exports.bulkDeleteCoupons = async (req, res) => {
    try {
        const { ids } = req.body;
        if (ids.length == 0) {
            return res.status(400).json({ success: false, message: "Coupon ID is required" });
        }
        let result = [];
        for (let id of ids) {
            try {
                const deletedCoupon = await Coupon.findByIdAndDelete(id);
                if (!deletedCoupon) {
                    result.push({ success: false, couponId: id, message: "Coupon not found" });
                }
                result.push({ success: true, message: "Coupon deleted successfully" });
            } catch (error) {
                console.error("Delete Coupon Error:", error);
                result.push({ success: false, couponId: id, message: "Server error", error: error.message });
            }
        }
        res.status(200).json({ success: true, message: "Coupons deleted successfully", result });

    } catch (error) {
        console.error("Delete Coupon Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};