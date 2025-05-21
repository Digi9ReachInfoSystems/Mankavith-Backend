const Blog = require("../model/blogModel");

exports.createBlog = async(req, res) => {
    const { title, description, image } = req.body;
    try {
        const blog = await Blog.create({
            title,
            description,
            image,
        });
        res.status(201).json({
            success: true,
            blog,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

exports.getBlogById = async(req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        res.status(200).json({
            success: true,
            blog,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

exports.getAllBlogs = async(req, res) => {
    try {
        const blogs = await Blog.find();
        res.status(200).json({
            success: true,
            blogs,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

exports.deleteBlogById = async(req, res) => {
    try {
        const blog = await Blog.findByIdAndDelete(req.params.id);
        res.status(200).json({
            success: true,
            blog,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

exports.updateBlogById = async(req, res) => {
 const {id} = req.params;
 const {title, description, image} = req.body;
 try {
    const blog = await Blog.findByIdAndUpdate(id, {title, description, image}, {new: true});
    res.status(200).json({
        success: true,
        blog,
    });
 } catch (error) {
    res.status(400).json({
        success: false,
        message: error.message,
    });
 }
}