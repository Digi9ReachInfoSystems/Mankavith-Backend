const express = require("express");
const router = express.Router();
const blogController = require("../controller/blogController");

router.post("/create", blogController.createBlog);
router.get("/getAllBlogs", blogController.getAllBlogs);
router.put("/updateBlog/:id", blogController.updateBlogById);
router.delete("/deleteBlog/:id", blogController.deleteBlogById);
router.get("/getBlogById/:id", blogController.getBlogById);


module.exports = router;