const { createHandler, sendJson } = require('../_lib/http');
const { deleteRecord, readStore, writeStore } = require('../_lib/mobileStore');
const { authenticateToken } = require('../_lib/services');

function requireAdmissionStaff(req) {
    const user = authenticateToken(req);
    if (!['Admin', 'Principal', 'Staff'].includes(String(user.role || ''))) {
        const error = new Error('School staff access required.');
        error.statusCode = 403;
        throw error;
    }
}

module.exports = createHandler({
    POST: async ({ req, res, body }) => {
        requireAdmissionStaff(req);
        const records = readStore('online_admissions');
        const index = records.findIndex((item) => String(item.id) === String(req.query.id));
        if (index < 0) return sendJson(res, 404, { success: false, message: 'Application not found.' });
        const status = String(body?.status || '').trim();
        if (!['New', 'Contacted', 'Closed', 'Rejected', 'Approved'].includes(status)) return sendJson(res, 400, { success: false, message: 'Invalid application status.' });
        records[index] = { ...records[index], status, updatedAt: new Date().toISOString() };
        writeStore('online_admissions', records);
        sendJson(res, 200, { success: true, application: records[index], applications: records });
    },
    DELETE: async ({ req, res }) => {
        requireAdmissionStaff(req);
        const applications = deleteRecord('online_admissions', req.query.id);
        sendJson(res, 200, { success: true, deleted: true, applications });
    }
});
