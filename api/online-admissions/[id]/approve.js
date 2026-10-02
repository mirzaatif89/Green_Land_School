const { createHandler, sendJson } = require('../../_lib/http');
const { getDb } = require('../../_lib/db');
const { readStore, writeStore } = require('../../_lib/mobileStore');
const { authenticateToken } = require('../../_lib/services');

module.exports = createHandler({
    POST: async ({ req, res, db }) => {
        const user = authenticateToken(req);
        if (!['Admin', 'Principal'].includes(String(user.role || ''))) {
            return sendJson(res, 403, { success: false, message: 'Administrator access is required to approve admissions.' });
        }
        const records = readStore('online_admissions');
        const index = records.findIndex((item) => String(item.id) === String(req.query.id));
        if (index < 0) return sendJson(res, 404, { success: false, message: 'Application not found.' });
        const application = records[index];
        const { Student, ClassFee } = db.models;
        let student = application.studentId ? await Student.findByPk(application.studentId) : null;
        if (!student) {
            const stamp = Date.now().toString(36).toUpperCase();
            const studentId = `STU-ONL-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
            const [classFees, existingEmail] = await Promise.all([
                ClassFee.findAll(),
                application.email ? Student.findOne({ where: { email: application.email } }) : Promise.resolve(null)
            ]);
            const classFee = classFees.find((item) => String(item.className || '').trim().toLowerCase() === String(application.className || '').trim().toLowerCase());
            try {
                student = await Student.create({
                    id: studentId,
                    studentCode: `ONL-${stamp}`,
                    fullName: application.studentName,
                    fatherName: application.fatherName || '',
                    dob: application.dateOfBirth,
                    admissionDate: new Date().toISOString().slice(0, 10),
                    classGrade: application.className,
                    section: 'General',
                    campusName: application.campus || user.campusName || 'Main Campus',
                    gender: application.gender,
                    parentPhone: application.phone,
                    guardianName: application.parentName,
                    guardianContact: application.phone,
                    email: existingEmail ? null : (application.email || null),
                    address: application.address,
                    formB: application.formB || '',
                    cnic: application.cnic || '',
                    monthlyFee: classFee?.monthlyFee ? String(classFee.monthlyFee) : '',
                    monthlyFeeCustom: false,
                    freeStudy: false,
                    remainingAmount: '0',
                    feeFrequency: classFee?.feeFrequency || 'Monthly',
                    feesStatus: 'Pending',
                    enrollmentStatus: 'Active',
                    role: 'Student'
                });
            } catch (error) {
                return sendJson(res, 409, { success: false, message: error.message || 'Student record could not be created.' });
            }
            application.studentId = student.id;
            application.studentCode = student.studentCode;
        }
        application.status = 'Approved';
        application.updatedAt = new Date().toISOString();
        records[index] = application;
        try {
            writeStore('online_admissions', records);
        } catch (error) {
            await Student.destroy({ where: { id: student.id } }).catch(() => {});
            return sendJson(res, 500, { success: false, message: 'Application could not be updated after creating the student.' });
        }
        sendJson(res, 200, { success: true, application, student: { id: student.id, studentCode: student.studentCode }, applications: records });
    }
}, { getDb });
