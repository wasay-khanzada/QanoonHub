const Case = require('../models/case')
const Document = require('../models/document')
const User = require('../models/user')
const Notification = require('../models/notification')
const getUserInfo = require('../helpers/getUserInfo');
// const Appointment = require('../models/appointment')
const mongoose = require('mongoose');
const { hashPassword, comparePassword } = require('../helpers/auth')
const jwt = require('jsonwebtoken');

const dashboardStatistic = async (req, res) => {
    try {
        // Get total counts for dashboard summary
        const totalCases = await Case.countDocuments();
        const totalDocuments = await Document.countDocuments();
        const totalUsers = await User.countDocuments();

        // Breakdown by type
        const totalClients = await User.countDocuments({ type: "client" });
        const totalLawyers = await User.countDocuments({ type: "lawyer" });
        const totalAdmins = await User.countDocuments({ type: "admin" });

        // Case status breakdown
        const openCases = await Case.countDocuments({ case_status: "Open" });
        const assignedCases = await Case.countDocuments({ case_status: "Assigned" });
        const inProgressCases = await Case.countDocuments({ case_status: "In Progress" });
        const completedCases = await Case.countDocuments({ case_status: "Completed" });
        const closedCases = await Case.countDocuments({ case_status: "Closed" });

        return res.status(200).json({
            totalCases,
            totalDocuments,
            totalUsers,
            totalClients,
            totalLawyers,
            totalAdmins,
            openCases,
            assignedCases,
            inProgressCases,
            completedCases,
            closedCases
        });
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

const getNotifications = async (req, res) => {
    const { userId, type } = getUserInfo(res)
    const allUpdatedNoti = []
    try {
        const allNotifications = await Notification.find(
            {
                "notification_recipient_id_and_status.recipient_id": userId,
            }
        ).sort( { "notification_sent_date": -1 } )

        allNotifications.forEach((noti, i)=>{
            let read = false
            noti._doc.notification_recipient_id_and_status.forEach(stat=>{
                if(stat.recipient_id === userId && stat.status === "read") 
                    read = true;
            })
            allUpdatedNoti.push({...noti._doc, read})
        })

        const unreadNoti = allUpdatedNoti.filter((noti)=> {return !noti.read})
        const readNoti = allUpdatedNoti.filter((noti)=> {return noti.read})

        const updatedNoti = await Notification.updateMany({
            "notification_recipient_id_and_status.recipient_id": userId
          }, {
            $set: {
              "notification_recipient_id_and_status.$.status": "read"
            }
          })

        if (!allNotifications)
            throw new DataNotExistError("Notifications not exist")

        return res.status(200).send([...unreadNoti, ...readNoti])
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


module.exports = { dashboardStatistic, getNotifications }