const Note = require('../model/notes_model.js');
const Subject = require('../model/subject_model');
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
// const blobServiceClient = require('../utils/azureBlobService.js');
// Create Note
module.exports.createNote = async (req, res) => {
  try {
    const { noteName, noteDisplayName, isDownload, fileUrl, subjects } = req.body;

    // Ensure the subjects are valid references
    const validSubjects = await Subject.find({ '_id': { $in: subjects } });

    if (validSubjects.length !== subjects.length) {
      return res.status(400).json({ success: false, message: 'Some subjects are invalid' });
    }
    const existingNote = await Note.findOne({ noteName });
    if (existingNote) {
      return res.status(400).json({ success: false, message: 'Note name already exists' });
    }

    const newNote = new Note({
      noteName,
      noteDisplayName,
      isDownload,
      fileUrl,
      subjects
    });
    if (subjects.length > 0) {
      for (let i = 0; i < subjects.length; i++) {
        const subject = await Subject.findById(subjects[i]);
        if (subject) {
          if (!subject.notes) {
            subject.notes = [];
          }
          subject.notes.push(newNote._id);
          await subject.save();
        }

      }
    }

    const savedNote = await newNote.save();
    return res.status(201).json({ success: true, message: 'Note created successfully', data: savedNote });
  } catch (error) {
    console.error('Error creating note:', error);
    return res.status(500).json({ success: false, message: 'Error creating note', error: error.message });
  }
};

// Get All Notes
module.exports.getAllNotes = async (req, res) => {
  try {
    const notes = await Note.find()
      .populate('subjects');  // Populate subjects reference
    return res.status(200).json({ success: true, data: notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return res.status(500).json({ success: false, message: 'Error fetching notes', error: error.message });
  }
};

// Get Note by ID
module.exports.getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id)
      .populate('subjects');
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    return res.status(200).json({ success: true, data: note });
  } catch (error) {
    console.error('Error fetching note:', error);
    return res.status(500).json({ success: false, message: 'Error fetching note', error: error.message });
  }
};

// Update Note
module.exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    let updatedData = req.body;
    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    await Promise.all(
      note.subjects.map(async (subjectId) => {
        const subject = await Subject.findById(subjectId);
        if (!subject) {
          return;
        }
        subject.notes.pull(id);
        await subject.save();
      })
    );

    // Validate subjects references
    const validSubjects = await Subject.find({ '_id': { $in: updatedData.subjects } });
    if (validSubjects.length !== updatedData.subjects.length) {
      return res.status(400).json({ success: false, message: 'Some subjects are invalid' });
    }
    await Promise.all(
      updatedData.subjects.map(async (subjectId) => {
        const subject = await Subject.findById(subjectId);
        if (!subject) {
          updatedData.subjects = updatedData.subjects.filter(id => id !== subjectId);
          return;
        }
        subject.notes.push(id);
        await subject.save();
      })
    );
    const updatedNote = await Note.findByIdAndUpdate(id, updatedData, { new: true })
      .populate('subjects');
    if (!updatedNote) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    return res.status(200).json({ success: true, message: 'Note updated successfully', data: updatedNote });
  } catch (error) {
    console.error('Error updating note:', error);
    return res.status(500).json({ success: false, message: 'Error updating note', error: error.message });
  }
};

// Delete Note
module.exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const notes = await Note.findById(id);
    if (!notes) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    await Promise.all(
      notes.subjects.map(async (subjectId) => {
        const subject = await Subject.findById(subjectId);
        if (!subject) {
          return;
        }
        subject.notes.pull(id);
        await subject.save();
      })
    );
    const deletedNote = await Note.findByIdAndDelete(id);
    if (!deletedNote) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    return res.status(200).json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    return res.status(500).json({ success: false, message: 'Error deleting note', error: error.message });
  }
};


module.exports.getNoOfNotes = async (req, res) => {
  try {
    const count = await Note.countDocuments();
    return res.status(200).json({
      success: true,
      count: count,  // Changed from 'data' to 'count' for clarity
    });
  } catch (error) {
    console.error("Error fetching number of notes:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch number of notes.",
      error: error.message,
    });
  }
};
module.exports.bulkDeleteNotes = async (req, res) => {
  try {
    const { notesIds } = req.body;
    if (notesIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No note IDs provided' });
    }
    const results = [];
    for (const id of notesIds) {
      try {


        const notes = await Note.findById(id);
        if (!notes) {
          results.push({ id, success: false, message: 'Note not found' });
          continue;
        }
        await Promise.all(
          notes.subjects.map(async (subjectId) => {
            const subject = await Subject.findById(subjectId);
            if (!subject) {
              return;
            }
            subject.notes.pull(id);
            await subject.save();
          })
        );
        const deletedNote = await Note.findByIdAndDelete(id);
        if (!deletedNote) {
          results.push({ id, success: false, message: 'Note not found' });
          continue;
        }
        results.push({ id, success: true, message: 'Note deleted successfully' });
      } catch (error) {
        console.error('Error processing note ID:', id, error);
        results.push({ id, success: false, message: 'Error processing note ID' });
        continue;
      }
    }
    return res.status(200).json({ success: true, message: 'Bulk delete operation completed', results });

  } catch (error) {
    console.error('Error deleting note:', error);
    return res.status(500).json({ success: false, message: 'Error deleting note', error: error.message });
  }
};

module.exports.getAllNotesBySubjectIds = async (req, res) => {
  try {
    const { subjectIds } = req.body;
    if (subjectIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No subject IDs provided' });
    }
    const notes = await Note.find({ subjects: { $in: subjectIds } });
    return res.status(200).json({ success: true, data: notes });
  } catch (error) {
    console.error('Error fetching notes by subject IDs:', error);
    return res.status(500).json({ success: false, message: 'Error fetching notes by subject IDs', error: error.message });
  }
}