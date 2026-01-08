const fs = require('fs')
const getUserInfo = require('../helpers/getUserInfo');
const saveNotifications = require('../helpers/saveNotification');
const { DataNotExistError, UserNotSameError, DoNotHaveAccessError } = require('../helpers/exceptions');
const validator = require('validator');
const Document = require('../models/document');
const mongoose = require('mongoose');
const { promisify } = require('util')
const Case = require('../models/case');
const Message = require('../models/message');
const User = require('../models/user');
const templates = require('../helpers/documentTemplates');
const path = require("path");
const { loadTemplate, fillTemplate } = require("../helpers/documentGenerator");
const { generatePDF, generateDOCX } = require("../helpers/fileGenerator");



const checkCaseAccess = async (userId, type, caseId) => {
    let cases;
    if (type === "admin")
        cases = await Case.findById(new mongoose.Types.ObjectId(caseId))
    else
        cases = await Case.find(
            {
                "case_member_list.case_member_id": userId,
                "case_member_list.case_member_type": type,
                "_id": new mongoose.Types.ObjectId(caseId)
            }
        )

    if (!cases || cases.length === 0)
        throw new DataNotExistError("Case not exist")
}

const updateDoc = async (req, res) => {
    const { userId, type } = getUserInfo(res)

    const {
        q: { q_id, q_caseId },
        doc_link,
        doc_type,
        filesize,
        uploaded_at,
        last_accessed_at,
        doc_title,
        uploaded_by,
        can_be_access_by,
        doc_case_related,
        doc_description
    } = req.body

    const filter = {
        "doc_case_related": q_caseId,
        "uploaded_by": userId,
        "_id": new mongoose.Types.ObjectId(q_id)
    }

    const update = {
        doc_type,
        doc_title,
        can_be_access_by,
        doc_description
    }

    try {
        await checkCaseAccess(userId, type, filter.doc_case_related)

        const selectedDocument = type !== "admin" ? await Document.findOneAndUpdate(
            filter, {
            ...update,
            "$push":
            {
                "last_accessed_at": {
                    "userId": userId,
                    "type": type,
                    "action": "edit",
                    "access_date_time": String(Date.now())
                }
            }
        }, { new: true }
        ) : await Document.findByIdAndUpdate(filter._id,
            update
        )

        if (!selectedDocument) {
            throw new DataNotExistError("Document not exist")
        }
        let editedByUserName = await User.findById(new mongoose.Types.ObjectId(userId)).select(['username']);
        let editedCaseName = await Case.findById(new mongoose.Types.ObjectId(q_caseId)).select(['case_title']);
        
        await saveNotifications(`${editedByUserName.username} has edited document in this case: ${editedCaseName.case_title}`, can_be_access_by, "editDocument", `/php/document/view.php?id=${selectedDocument._id}&cid=${editedCaseName._id}`)

        return res.status(200).send(selectedDocument)
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            // Mongoose validation error
            const validationErrors = {};

            for (const field in error.errors)
                validationErrors[field] = error.errors[field].message;

            return res.status(400).json({
                error: 'Validation failed',
                validationErrors,
            });
        } else {
            res.status(400).json({
                error: error.name,
                message: error.message
            })
        }
    }
}

const readDoc = async (req, res) => {
    const { userId, type } = getUserInfo(res)
    const { id, caseId } = req.params
    try {
        // check curent user is in case?
        await checkCaseAccess(userId, type, caseId)

        // findandupdate
        const requestedDocument = await Document.findByIdAndUpdate(new mongoose.Types.ObjectId(id),
            {
                "$push":
                {
                    "last_accessed_at": {
                        "userId": userId,
                        "type": type,
                    "action": "view",
                    "access_date_time": String(Date.now())
                }
                }
            }, { new: true }
        )

        const uploadUserId = requestedDocument.uploaded_by
        let uploadedByUserName = await User.findById(new mongoose.Types.ObjectId(uploadUserId)).select(['username', 'avatar_url']);

        const lastAccessUserId = requestedDocument.last_accessed_at && requestedDocument.last_accessed_at.length > 0
            ? requestedDocument.last_accessed_at[requestedDocument.last_accessed_at.length - 1].userId
            : requestedDocument.uploaded_by;
        let lastAccessedByUserName = await User.findById(new mongoose.Types.ObjectId(lastAccessUserId)).select(['username', 'avatar_url']);

        const relatedCaseId = requestedDocument.doc_case_related
        let relatedCaseName = await Case.findById(new mongoose.Types.ObjectId(relatedCaseId)).select('case_title');

        if (!requestedDocument)
            throw new DataNotExistError("Document not exist")

        return res.status(200).send({ ...requestedDocument._doc, canEdit: requestedDocument.uploaded_by === userId, uploadedByUserName, lastAccessedByUserName, relatedCaseName })
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            // Mongoose validation error
            const validationErrors = {};

            for (const field in error.errors)
                validationErrors[field] = error.errors[field].message;

            return res.status(400).json({
                error: 'Validation failed',
                validationErrors,
            });
        } else {
            res.status(400).json({
                error: error.name,
                message: error.message
            })
        }
    }
}

const listDoc = async (req, res) => {
    const { userId, type } = getUserInfo(res)
    try {
        // Filter documents based on user access
        let filter = {};
        
        if (type !== "admin") {
            // Non-admin users can only see documents they have access to
            filter = {
                "can_be_access_by": userId
            };
        }
        // Admin can see all documents, so no filter needed

        const allDocument = await Document.find(filter)
        let updatedCaseDocs = []
        for (const doc of allDocument) {
            // Double-check access for non-admin users (additional security)
            if (type !== "admin" && !doc.can_be_access_by.includes(userId)) {
                continue; // Skip this document if user doesn't have access
            }

            const uploadUserId = doc.uploaded_by
            let uploadedByUserName = await User.findById(new mongoose.Types.ObjectId(uploadUserId)).select(['username', 'avatar_url']);

            const lastAccessUserId = doc.last_accessed_at && doc.last_accessed_at.length > 0 
                ? doc.last_accessed_at[doc.last_accessed_at.length - 1].userId 
                : doc.uploaded_by;
            let lastAccessedByUserName = await User.findById(new mongoose.Types.ObjectId(lastAccessUserId)).select(['username', 'avatar_url']);

            const relatedCaseId = doc.doc_case_related
            let relatedCaseName = await Case.findById(new mongoose.Types.ObjectId(relatedCaseId)).select('case_title');

            updatedCaseDocs.push({ ...doc._doc, uploadedByUserName, lastAccessedByUserName, relatedCaseName })
        }

        if (!allDocument)
            throw new DataNotExistError("Document not exist")

        return res.status(200).send(updatedCaseDocs)
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            // Mongoose validation error
            const validationErrors = {};

            for (const field in error.errors)
                validationErrors[field] = error.errors[field].message;

            return res.status(400).json({
                error: 'Validation failed',
                validationErrors,
            });
        } else {
            res.status(400).json({
                error: error.name,
                message: error.message
            })
        }
    }
}

const listDocByCase = async (req, res) => {
    const { caseId } = req.params
    const { userId, type } = getUserInfo(res)
    try {
        const filter = type !== "admin" ? {
            "doc_case_related": caseId,
            "can_be_access_by": userId
        } : { "doc_case_related": caseId, }

        const caseDocuments = await Document.find(filter)
        let updatedCaseDocs = []
        for (const doc of caseDocuments) {
            const uploadUserId = doc.uploaded_by
            let uploadedByUserName = await User.findById(new mongoose.Types.ObjectId(uploadUserId)).select(['username', 'avatar_url']);

            const lastAccessUserId = doc.last_accessed_at && doc.last_accessed_at.length > 0
                ? doc.last_accessed_at[doc.last_accessed_at.length - 1].userId
                : doc.uploaded_by;
            let lastAccessedByUserName = await User.findById(new mongoose.Types.ObjectId(lastAccessUserId)).select(['username', 'avatar_url']);
            const relatedCaseId = doc.doc_case_related
            let relatedCaseName = await Case.findById(new mongoose.Types.ObjectId(relatedCaseId)).select('case_title');
            updatedCaseDocs.push({ ...doc._doc, uploadedByUserName, lastAccessedByUserName, relatedCaseName })
        }

        if (!caseDocuments)
            throw new DataNotExistError("Document not exist")
        await checkCaseAccess(userId, type, caseId)

        return res.status(200).send(updatedCaseDocs)
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            // Mongoose validation error
            const validationErrors = {};

            for (const field in error.errors)
                validationErrors[field] = error.errors[field].message;

            return res.status(400).json({
                error: 'Validation failed',
                validationErrors,
            });
        } else {
            res.status(400).json({
                error: error.name,
                message: error.message
            })
        }
    }
}

const createDoc = async (req, res) => {
    try {
        const { userId, type } = getUserInfo(res)
        // 🔹 TEMPLATE BASED DOCUMENT
        if (req.body.template_type) {
            const template = templates[req.body.template_type];

            if (!template) {
                return res.status(400).json({
                    error: 'Invalid template type'
                });
            }

            // Check case access
            await checkCaseAccess(userId, type, req.body.doc_case_related);

            // Get case members if can_be_access_by is not provided
            let can_be_access_by = req.body.can_be_access_by || [];
            if (!can_be_access_by || can_be_access_by.length === 0) {
                let cases = await Case.findById(new mongoose.Types.ObjectId(req.body.doc_case_related)).select('case_member_list');
                can_be_access_by = []
                cases.case_member_list.forEach((member) => {
                    can_be_access_by.push(member.case_member_id)
                })
            }

            const new_document = new Document({
                doc_type: req.body.template_type,
                doc_title: template.title,
                uploaded_by: userId,
                can_be_access_by: can_be_access_by,
                doc_case_related: req.body.doc_case_related,
                doc_description: template.description || template.title,
                doc_link_file: null,
                doc_link_fileId: null,
                doc_link_onlineDrive: null,
                doc_avatar: '/default-document-icon.png',
                filesize: 0,
                uploaded_at: String(Date.now()),
                last_accessed_at: [{
                    userId,
                    type,
                    action: "template_created",
                    access_date_time: String(Date.now())
                }],
                template_data: template   // ⭐ VERY IMPORTANT
            });

            const savedDoc = await new_document.save();
            
            // Send notification
            let uploadedByUserName = await User.findById(new mongoose.Types.ObjectId(userId)).select(['username']);
            let relatedCaseName = await Case.findById(new mongoose.Types.ObjectId(req.body.doc_case_related)).select('case_title');
            await saveNotifications(`${uploadedByUserName.username} has created a template document in this case: ${relatedCaseName.case_title}`, can_be_access_by, "addDocument", `/php/document/view.php?id=${savedDoc._id}&cid=${req.body.doc_case_related}`)
            
            return res.status(200).json(savedDoc);
        }

        
        
        // Check if file exists
        if (!req.file) {
            return res.status(400).json({
                error: 'No file uploaded'
            });
        }

        let {
            doc_type,
            filesize,
            uploaded_at,
            doc_title,
            uploaded_by,
            can_be_access_by,
            doc_case_related,
            req_msg_id,
            doc_description
        } = req.body

        // For now, use simple file paths instead of Google Drive/Cloudinary
        const doc_link_file = `/uploads/${req.file.filename}`;
        const doc_link_fileId = req.file.filename;
        const doc_link_onlineDrive = `/uploads/${req.file.filename}`;
        const doc_avatar = '/default-document-icon.png'; // Default icon

        if (!uploaded_by) {
            uploaded_by = userId
        }
        
        let uploadedByUserName = await User.findById(new mongoose.Types.ObjectId(uploaded_by)).select(['username']);
        let relatedCaseName = await Case.findById(new mongoose.Types.ObjectId(doc_case_related)).select('case_title');
        
        if (!can_be_access_by || can_be_access_by.length === 0) {
            let cases = await Case.findById(new mongoose.Types.ObjectId(doc_case_related)).select('case_member_list');
            can_be_access_by = []
            cases.case_member_list.forEach((member, i) => {
                can_be_access_by.push(member.case_member_id)
            })
        }

        const last_accessed = [{
            userId,
            type,
            action: "upload",
            access_date_time: String(Date.now())
        }]

        await checkCaseAccess(userId, type, doc_case_related)

        const new_document = new Document({
            doc_link_file,
            doc_link_fileId,
            doc_link_onlineDrive,
            doc_type,
            filesize,
            uploaded_at: String(Date.now()),
            doc_title,
            uploaded_by,
            can_be_access_by,
            doc_avatar,
            doc_case_related,
            doc_description,
            last_accessed_at: last_accessed
        });

        const document = await new_document.save();
        if (!document) {
            return res.status(400).json({
                error: 'No document uploaded'
            })
        }

        if (req_msg_id && req_msg_id !== "undefined") {
            const new_updated_message = await Message.findOneAndUpdate({
                "message_case_id": doc_case_related,
                "message_list._id": req_msg_id
            }
                ,
                {
                    $set: {
                        "message_list.$.message_type": "requested_and_uploaded"
                    }
                })
        }

        await saveNotifications(`${uploadedByUserName.username} has uploaded new document in this case: ${relatedCaseName.case_title}`, can_be_access_by, "addDocument",  `/php/document/view.php?id=${document._id}&cid=${relatedCaseName._id}`)

        return res.status(200).send(new_document)
    } catch (error) {
        console.error('Document upload error:', error);
        
        if (error instanceof mongoose.Error.ValidationError) {
            // Mongoose validation error
            const validationErrors = {};

            for (const field in error.errors)
                validationErrors[field] = error.errors[field].message;

            return res.status(400).json({
                error: 'Validation failed',
                validationErrors,
            });
        } else {
            res.status(500).json({
                error: error.name,
                message: error.message
            })
        }
    }
}

const deleteDoc = async (req, res) => {
    const { userId, type } = getUserInfo(res)
    const { id, caseId } = req.params

    const filter = type === "admin" ? {
        "_id": new mongoose.Types.ObjectId(id)
    } : {
        "doc_case_related": caseId,
        "uploaded_by": userId,
        "_id": new mongoose.Types.ObjectId(id)
    }

    try {
        await checkCaseAccess(userId, type, caseId)

        const deletedDocument = await Document.findOneAndDelete(filter)

        if (!deletedDocument)
            throw new DataNotExistError("Document not exist")

        // Delete local file
        try {
            const filePath = `uploads/${deletedDocument.doc_link_fileId}`;
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (fileError) {
            console.error('Error deleting local file:', fileError);
            // Continue with document deletion even if file deletion fails
        }

        let deletedByUserName = await User.findById(new mongoose.Types.ObjectId(userId)).select(['username']);
        let deletedCaseName = await Case.findById(new mongoose.Types.ObjectId(caseId)).select(['case_title']);
        
        await saveNotifications(`${deletedByUserName.username} has deleted ${deletedDocument.doc_title} (document) in this case: ${deletedCaseName.case_title}`, deletedDocument.can_be_access_by, "deleteDocument", `/php/case/view.php?cid=${caseId}`)

        return res.status(200).send(deletedDocument)
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            // Mongoose validation error
            const validationErrors = {};

            for (const field in error.errors)
                validationErrors[field] = error.errors[field].message;

            return res.status(400).json({
                error: 'Validation failed',
                validationErrors,
            });
        } else {
            res.status(400).json({
                error: error.name,
                message: error.message
            })
        }
    }
}

const getUserCases = async (req, res) => {
    try {
        const { userId, type } = getUserInfo(res);
        
        let cases;
        if (type === "admin") {
            // Admin can see all cases
            cases = await Case.find({}, '_id case_title case_type case_status');
        } else {
            // For clients and lawyers, find cases where they are members
            cases = await Case.find({
                "case_member_list.case_member_id": userId,
                "case_member_list.case_member_type": type
            }, '_id case_title case_type case_status');
        }

        res.status(200).json({
            success: true,
            data: cases
        });

    } catch (error) {
        console.error('Error fetching user cases:', error);
        res.status(500).json({
            error: 'Failed to fetch cases',
            message: error.message
        });
    }
};

const generateTemplateDocument = async (req, res) => {
    try {
        const { userId, type } = getUserInfo(res);
        const { documentId, format, templateData } = req.body;

        // Validate required fields
        if (!documentId) {
            return res.status(400).json({
                error: 'Document ID is required'
            });
        }

        if (!format || !['pdf', 'docx'].includes(format.toLowerCase())) {
            return res.status(400).json({
                error: 'Format must be either "pdf" or "docx"'
            });
        }

        // Find the document
        const document = await Document.findById(new mongoose.Types.ObjectId(documentId));
        
        if (!document) {
            return res.status(404).json({
                error: 'Document not found'
            });
        }

        // Check case access
        await checkCaseAccess(userId, type, document.doc_case_related);

        // Get template data (use provided data or document's template_data)
        const template = document.template_data || templates[document.doc_type];
        
        if (!template) {
            return res.status(400).json({
                error: 'Template not found for this document'
            });
        }

        // Use provided templateData or template default
        const dataToFill = templateData || {};
        
        // Fill the template with data
        const filledContent = fillTemplate(template.template, dataToFill);

        // Generate file
        const timestamp = Date.now();
        const fileName = `${document.doc_type}_${documentId}_${timestamp}.${format}`;
        const filePath = path.join(__dirname, '..', 'uploads', fileName);

        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        if (format.toLowerCase() === 'pdf') {
            await generatePDF(filledContent, filePath);
        } else {
            await generateDOCX(filledContent, filePath);
        }

        // Wait a bit to ensure file is fully written
        await new Promise(resolve => setTimeout(resolve, 100));

        // Update document with generated file info
        const fileStats = fs.statSync(filePath);
        document.doc_link_file = `/uploads/${fileName}`;
        document.doc_link_fileId = fileName;
        document.doc_link_onlineDrive = `/uploads/${fileName}`;
        document.filesize = fileStats.size;
        document.last_accessed_at.push({
            userId,
            type,
            action: "generated",
            access_date_time: String(Date.now())
        });

        await document.save();

        // Send file as response
        res.setHeader('Content-Type', format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        // Clean up file after sending (optional - you might want to keep it)
        // fileStream.on('end', () => {
        //     fs.unlinkSync(filePath);
        // });

    } catch (error) {
        console.error('Template generation error:', error);
        
        if (error instanceof mongoose.Error.ValidationError) {
            const validationErrors = {};
            for (const field in error.errors) {
                validationErrors[field] = error.errors[field].message;
            }
            return res.status(400).json({
                error: 'Validation failed',
                validationErrors,
            });
        } else {
            res.status(500).json({
                error: error.name || 'Internal Server Error',
                message: error.message
            });
        }
    }
};

module.exports = {
    createDoc, readDoc, listDoc, updateDoc, deleteDoc, listDocByCase, getUserCases, generateTemplateDocument
};
