const { createHandler, sendJson } = require('../_lib/http');
const { getDb } = require('../_lib/db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'eduCore_secret_key_2026';

function requireUser(req) {
    const authHeader = String(req.headers.authorization || '');
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
        const error = new Error('Login is required.');
        error.statusCode = 401;
        throw error;
    }
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (_error) {
        const error = new Error('Login is required.');
        error.statusCode = 401;
        throw error;
    }
}

function gradeFor(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
}

module.exports = createHandler({
    GET: async ({ req, res, db }) => {
        requireUser(req);
        const studentId = String(req.query?.studentId || '').trim();
        const subject = String(req.query?.subject || '').trim();
        const performances = await db.models.StudentPerformance.findAll({
            where: {
                ...(studentId ? { studentId } : {}),
                ...(subject ? { subject } : {})
            },
            order: [['performanceDate', 'DESC'], ['subject', 'ASC'], ['skill', 'ASC']]
        });
        sendJson(res, 200, { success: true, performances });
    },
    POST: async ({ req, res, db, body }) => {
        const user = requireUser(req);
        const items = Array.isArray(body) ? body : [body];
        for (const item of items) {
            const studentId = String(item?.studentId || '').trim();
            const subject = String(item?.subject || '').trim();
            const skill = String(item?.skill || '').trim();
            const learningOutcome = String(item?.learningOutcome || '').trim();
            const excellentDescription = String(item?.excellentDescription || '').trim();
            const satisfactoryDescription = String(item?.satisfactoryDescription || '').trim();
            const needsPracticeDescription = String(item?.needsPracticeDescription || '').trim();
            const rating = String(item?.rating || '').trim();
            const performanceDate = String(item?.performanceDate || item?.date || new Date().toISOString().slice(0, 10)).trim();
            const performanceMonth = String(item?.performanceMonth || performanceDate.slice(0, 7)).trim();
            const percentage = Number(item?.percentage ?? 0);
            if (!studentId || !subject) {
                const error = new Error('Student and subject are required.');
                error.statusCode = 400;
                throw error;
            }
            if (user.role === 'Teacher') {
                const teacher = await db.models.Teacher.findByPk(user.id, { attributes: ['subject'] });
                const assignedSubjects = String(teacher?.subject || '').split(/[,|]/).map(value => value.trim().toLowerCase()).filter(Boolean);
                const specialTeacherReports = ['co-curriculum', 'participation'];
                if (!assignedSubjects.includes(subject.toLowerCase()) && !specialTeacherReports.includes(subject.toLowerCase())) {
                    const error = new Error('You can only add performance for your assigned subject.');
                    error.statusCode = 403;
                    throw error;
                }
            }
            if (skill && skill !== '__subject_marks__' && (!learningOutcome || !['Excellent', 'Satisfactory', 'Needs Practice'].includes(rating))) {
                const error = new Error('Skill, learning outcome, and rating are required.');
                error.statusCode = 400;
                throw error;
            }
            if (skill && skill !== '__subject_marks__' && ((excellentDescription && satisfactoryDescription) || (!excellentDescription && !satisfactoryDescription && !needsPracticeDescription))) {
                const error = new Error('Enter Excellent, or enter Satisfactory and/or Needs Practice.');
                error.statusCode = 400;
                throw error;
            }
            if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
                const error = new Error('Percentage must be from 0 to 100.');
                error.statusCode = 400;
                throw error;
            }
            const id = String(item?.id || `PERF-${studentId}-${subject}-${performanceDate}-${skill || 'summary'}`).replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 255);
            await db.models.StudentPerformance.upsert({
                id,
                studentId,
                studentName: String(item.studentName || '').trim(),
                classGrade: String(item.classGrade || '').trim(),
                section: String(item.section || item.classSection || '').trim() || null,
                subject,
                examType: String(item?.examType || '').trim() || null,
                examYear: String(item?.examYear || '').trim() || null,
                obtainedMarks: item?.obtainedMarks == null || item.obtainedMarks === '' ? null : Number(item.obtainedMarks),
                totalMarks: item?.totalMarks == null || item.totalMarks === '' ? null : Number(item.totalMarks),
                percentage,
                grade: String(item.grade || gradeFor(percentage)).trim(),
                skill,
                learningOutcome,
                rating,
                excellentDescription,
                satisfactoryDescription,
                needsPracticeDescription,
                performanceDate,
                performanceMonth,
                remarks: String(item.remarks || '').trim(),
                updatedAtLabel: new Date().toISOString()
            });
        }
        const studentId = String(items[0]?.studentId || '').trim();
        const performances = await db.models.StudentPerformance.findAll({
            where: studentId ? { studentId } : {},
            order: [['performanceDate', 'DESC'], ['subject', 'ASC'], ['skill', 'ASC']]
        });
        sendJson(res, 200, { success: true, performances });
    },
    DELETE: async ({ req, res, db }) => {
        requireUser(req);
        const recordId = String(req.query?.recordId || '').trim();
        if (recordId) {
            await db.models.StudentPerformance.destroy({ where: { id: recordId } });
            sendJson(res, 200, { success: true, message: 'Performance record deleted.' });
            return;
        }
        const studentId = String(req.query?.studentId || '').trim();
        if (!studentId) {
            const error = new Error('Student id is required.');
            error.statusCode = 400;
            throw error;
        }
        await db.models.StudentPerformance.destroy({ where: { studentId } });
        sendJson(res, 200, { success: true, message: 'Student performance records deleted.' });
    }
}, { getDb });
