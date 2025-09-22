const Testimonials = require("../model/testimonialsModel");

// exports.createTestimonials = async (req, res) => {
//     const { name, rank, description,testimonial_image } = req.body;

//     try {
//         const testimonials = new Testimonials({ name, rank, description,testimonial_image });
//         await testimonials.save();
//         res.status(201).json(testimonials);
//         res.status(201).json({ message: "Testimonials created successfully" });
//     } catch (error) {
//         res.status(500).json({ message: "Error creating testimonials" });
//     }
// };

exports.createTestimonials = async (req, res) => {
  const {
    name,
    rank,
    description,
    testimonial_image,
    testimonial_video
  } = req.body;

  // Enforce exactly one at the API level, too:
  if ((testimonial_image && testimonial_video) || (!testimonial_image && !testimonial_video)) {
    return res.status(400).json({
      message: "Please include exactly one: testimonial_image or testimonial_video."
    });
  }

  try {
    const testimonial = new Testimonials({
      name,
      rank,
      description,
      testimonial_image,
      testimonial_video
    });
    await testimonial.save();
    return res.status(201).json({
      message: "Testimonial created successfully",
      testimonial
    });
  } catch (error) {
    console.error("Error creating testimonial:", error);
    return res.status(500).json({
      message: "Error creating testimonial",
      error: error.message
    });
  }
};


exports.getTestimonialsById = async (req, res) => {
  const { id } = req.params;
  try {
    const testimonials = await Testimonials.findById(id);
    if (!testimonials) {
      return res.status(404).json({ error: "Testimonials not found" });
    }
    res.status(200).json(testimonials);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve testimonials" });
  }
};

exports.getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonials.find();
    res.status(200).json(testimonials);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve testimonials" });
  }
};


// exports.updateTestimonialsById = async (req, res) => {
//     const { id } = req.params;
//     const { name, rank, description,testimonial_image } = req.body;
//     try {
//         const testimonials = await Testimonials.findByIdAndUpdate(id, { name, rank, description, testimonial_image }, { new: true });
//         if (!testimonials) {
//             return res.status(404).json({ error: "Testimonials not found" });
//         }
//         res.status(200).json(testimonials);
//     } catch (error) {
//         res.status(500).json({ error: "Failed to update testimonials" });
//     }
// };

exports.updateTestimonialsById = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    rank,
    description,
    testimonial_image,
    testimonial_video
  } = req.body;

  if ((testimonial_image && testimonial_video) ||
    (!testimonial_image && !testimonial_video)) {
    return res.status(400).json({
      message: "Please include exactly one: testimonial_image or testimonial_video."
    });
  }

  // build update
  const update = { name, rank, description };
  const unset = {};
  if (testimonial_image) {
    update.testimonial_image = testimonial_image;
    unset.testimonial_video = "";
  } else {
    update.testimonial_video = testimonial_video;
    unset.testimonial_image = "";
  }

  try {
    const updated = await Testimonials.findByIdAndUpdate(
      id,
      { ...update, $unset: unset },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Testimonial not found" });
    }
    return res.status(200).json({
      message: "Testimonial updated successfully",
      testimonial: updated
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to update testimonial",
      error: error.message
    });
  }
};



exports.deleteTestimonialsById = async (req, res) => {
  const { id } = req.params;
  try {
    await Testimonials.findByIdAndDelete(id);
    res.json({ message: "Testimonials deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete testimonials" });
  }
};

exports.bulkDeleteTestimonials = async (req, res) => {
  const { ids } = req.body;
  try {
    let result = [];
    for (let id of ids) {
      const testimonial = await Testimonials.findById(id);
      if (!testimonial) {
        result.push({ success: false, testimonialId: id, message: "Testimonial not found" });
      } else {
        await Testimonials.findByIdAndDelete(id);
        result.push({ success: true, testimonialId: id, message: "Testimonial deleted successfully" });
      }
    }
    res.status(200).json({ success: true, message: "Testimonials deleted successfully", result });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete testimonials" });
  }
};