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

    const newNote = new Note({
      noteName,
      noteDisplayName,
      isDownload,
      fileUrl,
      subjects
    });

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
    const updatedData = req.body;

    // Validate subjects references
    const validSubjects = await Subject.find({ '_id': { $in: updatedData.subjects } });
    if (validSubjects.length !== updatedData.subjects.length) {
      return res.status(400).json({ success: false, message: 'Some subjects are invalid' });
    }

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

exports.uploadNotestest = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      sharedKeyCredential
    );

    const blobName = `${Date.now()}-${req.file.originalname}`;
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const uploadOptions = {
      blobHTTPHeaders: {
        blobContentType: 'image/jpeg',
        blobContentDisposition: 'inline'
      }
    };
    await blockBlobClient.uploadData(req.file.buffer,uploadOptions);
    const blobUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`;
    return res.status(200).json({ message: 'File uploaded successfully', blobName ,blobUrl});
  } catch (error) {
    console.error('Error creating note:', error);
    return res.status(500).json({ success: false, message: 'Error creating note', error: error.message });
  }
};