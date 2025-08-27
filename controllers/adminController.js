const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");
const Course = require("../models/Course");
const User = require("../models/User");
const Category = require("../models/Category");

// Admin Login
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({ token, message: "Admin login successful" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.addCourse = async (req, res) => {
  try {
    console.log('Received course data:', req.body);
    console.log('Received files:', req.files);

    const {
      title,
      description,
      instructor,
      price,
      category,
      subcategory,
      sub_subcategory,
      level,
      duration,
      tags,
      language,
      isPublished,
      learningOutcomes, // ✅ NEW FIELD
      whatYouWillLearn, // ✅ NEW FIELD
    } = req.body;

    // Handle file uploads
    const thumbnailFile = req.files?.thumbnail?.[0];
    const videoFile = req.files?.videoUrl?.[0]; // Note: field name matches frontend
    
    console.log('Thumbnail file:', thumbnailFile);
    console.log('Video file:', videoFile);

    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({
        message: "Title, description, and category are required"
      });
    }

    // Parse tags if it's a string
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        // Filter out empty tags
        parsedTags = parsedTags.filter(tag => tag && tag.trim() !== '');
      } catch (error) {
        console.error('Error parsing tags:', error);
        parsedTags = [];
      }
    }

    // ✅ Parse learningOutcomes if it's a string
    let parsedLearningOutcomes = [];
    if (learningOutcomes) {
      try {
        parsedLearningOutcomes = typeof learningOutcomes === 'string' ? JSON.parse(learningOutcomes) : learningOutcomes;
        // Filter out empty outcomes
        parsedLearningOutcomes = parsedLearningOutcomes.filter(outcome => outcome && outcome.trim() !== '');
      } catch (error) {
        console.error('Error parsing learning outcomes:', error);
        parsedLearningOutcomes = [];
      }
    }

    // ✅ Parse whatYouWillLearn if it's a string
    let parsedWhatYouWillLearn = [];
    if (whatYouWillLearn) {
      try {
        parsedWhatYouWillLearn = typeof whatYouWillLearn === 'string' ? JSON.parse(whatYouWillLearn) : whatYouWillLearn;
        // Filter out empty items
        parsedWhatYouWillLearn = parsedWhatYouWillLearn.filter(item => item && item.trim() !== '');
      } catch (error) {
        console.error('Error parsing what you will learn:', error);
        parsedWhatYouWillLearn = [];
      }
    }

    const course = new Course({
      title,
      description,
      instructor: instructor || 'You',
      price: parseFloat(price) || 0,
      category,
      subcategory: subcategory || '',
      sub_subcategory: sub_subcategory || '',
      level,
      duration,
      thumbnailUrl: thumbnailFile ? thumbnailFile.path : "",
      videoUrl: videoFile ? videoFile.path : "",
      
    console.log('Saving thumbnailUrl:', thumbnailFile ? thumbnailFile.path : '');
    console.log('Saving videoUrl:', videoFile ? videoFile.path : '');
      tags: parsedTags,
      language,
      isPublished: isPublished === 'true' || isPublished === true,
      learningOutcomes: parsedLearningOutcomes, // ✅ NEW FIELD
      whatYouWillLearn: parsedWhatYouWillLearn, // ✅ NEW FIELD
    });

    const savedCourse = await course.save();

    console.log('Course saved successfully:', savedCourse._id);

    res.status(201).json({
      message: "Course added successfully",
      course: savedCourse
    });
  } catch (error) {
    console.error("Error adding course:", error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors
      });
    }

    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



// Get All Courses
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.status(200).json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Course by Id
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (error) {
    console.error("Error fetching course by ID:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Course
exports.updateCourse = async (req, res) => {
  const courseId = req.params.id;
  const updateData = req.body;

  try {
    const updatedCourse = await Course.findByIdAndUpdate(courseId, updateData, { new: true });

    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({ message: "Course updated successfully", course: updatedCourse });
  } catch (error) {
    console.error("Error updating course:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Course
exports.deleteCourse = async (req, res) => {
  const courseId = req.params.id;

  try {
    const deletedCourse = await Course.findByIdAndDelete(courseId);

    if (!deletedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalCourses = await Course.countDocuments({});
    const publishedCourses = await Course.countDocuments({ isPublished: true });
    const totalUsers = await User.countDocuments({ role: "user" });

    res.status(200).json({
      totalCourses,
      publishedCourses,
      totalUsers,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
// Fixed Category Management Functions for adminController.js
// Replace the existing category functions with these

// Helper function to get all descendants of a category
const getDescendants = async (categoryId) => {
  const descendants = [];
  const children = await Category.find({ parentCategory: categoryId });

  for (const child of children) {
    descendants.push(child._id.toString());
    const childDescendants = await getDescendants(child._id);
    descendants.push(...childDescendants);
  }

  return descendants;
};

// Helper function to organize categories into tree structure
const organizeCategories = (categories) => {
  const categoryMap = {};
  const tree = [];

  // Create a map for quick lookup
  categories.forEach(cat => {
    categoryMap[cat._id] = { ...cat.toObject(), children: [] };
  });

  // Build the tree
  categories.forEach(cat => {
    if (cat.parentCategory) {
      const parent = categoryMap[cat.parentCategory];
      if (parent) {
        parent.children.push(categoryMap[cat._id]);
      }
    } else {
      tree.push(categoryMap[cat._id]);
    }
  });

  return tree;
};

// ✅ Get All Categories (for the frontend component)
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .populate('parentCategory', 'name level')
      .sort({ level: 1, name: 1 });

    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    res.status(500).json({
      message: "Failed to fetch categories",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ Add Category (simplified for frontend integration)
exports.addCategory = async (req, res) => {
  try {
    const { name, level, parentCategory, isActive = true } = req.body;

    // Input validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    if (!level || level < 1 || level > 3) {
      return res.status(400).json({ message: "Category level must be between 1 and 3" });
    }

    const trimmedName = name.trim();
    const categoryLevel = parseInt(level);

    // Validate parent category requirements
    if (categoryLevel > 1 && !parentCategory) {
      return res.status(400).json({ message: "Parent category is required for subcategories" });
    }

    if (categoryLevel === 1 && parentCategory) {
      return res.status(400).json({ message: "Main categories cannot have a parent" });
    }

    // Check if parent exists and validate level hierarchy
    if (parentCategory) {
      const parent = await Category.findById(parentCategory);
      if (!parent) {
        return res.status(400).json({ message: "Parent category not found" });
      }

      // Validate level hierarchy
      if (categoryLevel !== parent.level + 1) {
        return res.status(400).json({
          message: `Invalid level. Should be ${parent.level + 1} for the selected parent category`
        });
      }
    }

    // Check if category name already exists at the same level with same parent
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
      level: categoryLevel,
      parentCategory: parentCategory || null
    });

    if (existingCategory) {
      return res.status(400).json({
        message: "Category with this name already exists at this level"
      });
    }

    // Create category
    const category = new Category({
      name: trimmedName,
      level: categoryLevel,
      parentCategory: parentCategory || null,
      isActive: Boolean(isActive)
    });

    const savedCategory = await category.save();

    // Populate parent info for response
    await savedCategory.populate('parentCategory', 'name level');

    res.status(201).json({
      message: "Category added successfully",
      category: savedCategory
    });

  } catch (error) {
    console.error("Error adding category:", error.message);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Category name must be unique at this level"
      });
    }

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors
      });
    }

    res.status(500).json({
      message: "Failed to add category",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ Update Category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, level, parentCategory, isActive } = req.body;

    // Find existing category
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Input validation
    if (name && !name.trim()) {
      return res.status(400).json({ message: "Category name cannot be empty" });
    }

    const trimmedName = name?.trim() || category.name;
    const categoryLevel = level ? parseInt(level) : category.level;

    // Validate level changes
    if (categoryLevel !== category.level) {
      const children = await Category.find({ parentCategory: id });
      if (children.length > 0) {
        return res.status(400).json({
          message: "Cannot change level of category that has subcategories"
        });
      }
    }

    // Validate parent category changes
    if (parentCategory !== undefined && parentCategory !== category.parentCategory?.toString()) {
      if (parentCategory) {
        const parent = await Category.findById(parentCategory);
        if (!parent) {
          return res.status(400).json({ message: "Parent category not found" });
        }

        // Prevent circular references
        if (parentCategory === id) {
          return res.status(400).json({ message: "Category cannot be its own parent" });
        }

        // Check if trying to make a descendant its parent
        const descendants = await getDescendants(id);
        if (descendants.includes(parentCategory)) {
          return res.status(400).json({
            message: "Cannot make a descendant category as parent"
          });
        }

        // Validate level hierarchy
        if (categoryLevel !== parent.level + 1) {
          return res.status(400).json({
            message: `Invalid level. Should be ${parent.level + 1} for the selected parent category`
          });
        }
      }
    }

    // Check name uniqueness (exclude current category)
    if (trimmedName !== category.name) {
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
        level: categoryLevel,
        parentCategory: parentCategory !== undefined ? (parentCategory || null) : category.parentCategory,
        _id: { $ne: id }
      });

      if (existingCategory) {
        return res.status(400).json({
          message: "Category with this name already exists at this level"
        });
      }
    }

    // Update category
    const updateData = {
      name: trimmedName,
      level: categoryLevel,
      parentCategory: parentCategory !== undefined ? (parentCategory || null) : category.parentCategory,
      isActive: isActive !== undefined ? Boolean(isActive) : category.isActive
    };

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('parentCategory', 'name level');

    res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory
    });

  } catch (error) {
    console.error("Error updating category:", error.message);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Category name must be unique at this level"
      });
    }

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors
      });
    }

    res.status(500).json({
      message: "Failed to update category",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ Delete Category (with validation)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if category has children
    const children = await Category.find({ parentCategory: id });
    if (children.length > 0) {
      return res.status(400).json({
        message: `Cannot delete category that has ${children.length} subcategories. Please delete subcategories first.`
      });
    }

    // Check if category is being used by any courses
    const Course = require("../models/Course");
    const coursesUsingCategory = await Course.find({ category: id });
    if (coursesUsingCategory.length > 0) {
      return res.status(400).json({
        message: `Cannot delete category. It is being used by ${coursesUsingCategory.length} course(s)`
      });
    }

    // Delete the category
    await Category.findByIdAndDelete(id);

    res.status(200).json({
      message: "Category deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting category:", error.message);
    res.status(500).json({
      message: "Failed to delete category",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ Get Category Tree (Hierarchical structure for dropdowns)
exports.getCategoryTree = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('parentCategory', 'name level')
      .sort({ level: 1, name: 1 });

    const categoryTree = organizeCategories(categories);

    res.status(200).json({
      categories: categories,
      tree: categoryTree
    });
  } catch (error) {
    console.error("Error fetching category tree:", error.message);
    res.status(500).json({
      message: "Failed to fetch category tree",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};