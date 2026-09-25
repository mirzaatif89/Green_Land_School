const { createHandler, sendJson } = require('../_lib/http');
const { deleteRecord } = require('../_lib/mobileStore');

module.exports = createHandler({
    DELETE: async ({ req, res }) => {
        const id = String(req.params?.id || req.query?.id || '').trim();
        if (!id) {
            sendJson(res, 400, { success: false, message: 'Result record id is required.' });
            return;
        }
        const records = deleteRecord('student_results', id);
        sendJson(res, 200, { success: true, deleted: true, results: records });
    }
});
