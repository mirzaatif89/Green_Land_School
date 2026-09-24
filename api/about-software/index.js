const { createHandler, sendJson } = require('../_lib/http');
const { readStore, upsertRecord } = require('../_lib/mobileStore');

const defaultAboutSoftware = {
    id: 'ABOUT-SOFTWARE',
    appName: 'Green Land Model School Jand',
    schoolName: 'Green Land Model School Jand',
    website: process.env.SCHOOL_WEBSITE || '',
    supportEmail: process.env.SMTP_FROM_EMAIL || '',
    supportPhone: '+92 300 5203469',
    schoolAddress: 'Haji Bazar Chowk, Tehsil Road Jand.',
    principalName: 'Malik M. Tahir Suleman',
    description: 'Student and teacher portal APIs for Green Land Model School Jand.',
    version: '1.0.0'
};

module.exports = createHandler({
    GET: async ({ res }) => {
        const records = readStore('about_software');
        sendJson(res, 200, { success: true, aboutSoftware: records[0] || defaultAboutSoftware });
    },
    POST: async ({ res, body }) => {
        const { record } = upsertRecord('about_software', {
            ...defaultAboutSoftware,
            ...(body || {}),
            id: body?.id || defaultAboutSoftware.id
        }, 'ABOUT');
        sendJson(res, 200, { success: true, aboutSoftware: record });
    }
});
