const { createHandler, sendJson } = require('../_lib/http');
const { readStore, upsertRecord } = require('../_lib/mobileStore');
const { authenticateToken } = require('../_lib/services');
const { getDb } = require('../_lib/db');

function clean(value, maxLength = 500) {
    return String(value ?? '').replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function normalizeIdentifier(value) {
    return String(value ?? '').replace(/[^a-z0-9]/gi, '').toUpperCase();
}

function requireAdmissionStaff(req) {
    const user = authenticateToken(req);
    if (!['Admin', 'Principal', 'Staff'].includes(String(user.role || ''))) {
        const error = new Error('School staff access required.');
        error.statusCode = 403;
        throw error;
    }
    return user;
}

module.exports = createHandler({
    GET: async ({ req, res }) => {
        requireAdmissionStaff(req);
        sendJson(res, 200, { success: true, applications: readStore('online_admissions') });
    },
    POST: async ({ res, body, db }) => {
        const input = body && typeof body === 'object' ? body : {};
        if (clean(input.website, 200)) return sendJson(res, 201, { success: true, application: { id: 'received' } });
        const application = {
            studentName: clean(input.studentName, 100),
            fatherName: clean(input.fatherName, 100),
            dateOfBirth: clean(input.dateOfBirth, 20),
            gender: clean(input.gender, 20),
            className: clean(input.className, 50),
            campus: clean(input.campus, 80),
            parentName: clean(input.parentName, 100),
            relationship: clean(input.relationship, 30),
            phone: clean(input.phone, 30),
            alternatePhone: clean(input.alternatePhone, 30),
            email: clean(input.email, 191).toLowerCase(),
            address: clean(input.address, 500),
            previousSchool: clean(input.previousSchool, 150),
            previousClass: clean(input.previousClass, 60),
            formB: clean(input.formB, 50),
            cnic: clean(input.cnic, 30),
            message: clean(input.message, 1000),
            status: 'New',
            createdAt: new Date().toISOString()
        };
        if (!application.studentName || !application.fatherName || !application.dateOfBirth || !application.gender || !application.className || !application.parentName || !application.relationship || !application.phone || !application.address) {
            return sendJson(res, 400, { success: false, message: 'Please complete all required student, father, parent, contact, class and address fields.' });
        }
        if (application.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(application.email)) {
            return sendJson(res, 400, { success: false, message: 'Please enter a valid email address.' });
        }
        const formB = normalizeIdentifier(application.formB);
        const cnic = normalizeIdentifier(application.cnic);
        if (formB || cnic) {
            const existingApplications = readStore('online_admissions');
            const applicationMatch = existingApplications.some((item) =>
                (formB && normalizeIdentifier(item.formB) === formB) ||
                (cnic && normalizeIdentifier(item.cnic) === cnic)
            );
            const students = await db.models.Student.findAll({ attributes: ['formB', 'cnic'] });
            const studentMatch = students.some((item) =>
                (formB && normalizeIdentifier(item.formB) === formB) ||
                (cnic && normalizeIdentifier(item.cnic) === cnic)
            );
            if (applicationMatch || studentMatch) {
                return sendJson(res, 409, {
                    success: false,
                    code: 'ALREADY_APPLIED',
                    message: 'An application with this B-Form or CNIC has already been submitted. Please contact the school if you need help.'
                });
            }
        }
        const { record } = upsertRecord('online_admissions', application, 'ADM');
        sendJson(res, 201, { success: true, application: { id: record.id, status: record.status } });
    }
}, { getDb });
