const Category = require("../model/category_model");

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({
      title: { $regex: new RegExp(`^${title}$`, 'i') }
    });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this title already exists",
      });
    }

    const newCategory = new Category({ title });
    const savedCategory = await newCategory.save();

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: savedCategory,
    });
  } catch (error) {
    console.error("Error creating category:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not create category.",
      error: error.message,
    });
  }
};

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ title: 1 });

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch categories.",
      error: error.message,
    });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const categoryId = req.params.id;

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error fetching category by ID:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch category.",
      error: error.message,
    });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { title },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not update category.",
      error: error.message,
    });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    const deletedCategory = await Category.findByIdAndDelete(categoryId);

    if (!deletedCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: deletedCategory,
    });
  } catch (error) {
    console.error("Error deleting category:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not delete category.",
      error: error.message,
    });
  }
};
