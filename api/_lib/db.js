const mysql = require('mysql2/promise');
const { Sequelize, DataTypes, Op } = require('sequelize');
const { syncAuthUsers } = require('./services');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

let startupPromise = null;
let sequelize = null;

function defineStudentModel(db) {
    return db.define('Student', {
        id: { type: DataTypes.STRING(100), primaryKey: true },
        studentCode: DataTypes.STRING(50),
        fullName: DataTypes.STRING(100),
        profileImage: DataTypes.TEXT('long'),
        fatherName: DataTypes.STRING(100),
        dob: DataTypes.STRING(20),
        admissionDate: DataTypes.STRING(20),
        classGrade: DataTypes.STRING(50),
        section: DataTypes.STRING(30),
        subjects: DataTypes.TEXT,
        campusName: DataTypes.STRING(80),
        gender: DataTypes.STRING(20),
        parentPhone: DataTypes.STRING(30),
        email: { type: DataTypes.STRING(191), unique: true, allowNull: true },
        rollNo: DataTypes.STRING(30),
        formB: DataTypes.STRING(50),
        monthlyFee: DataTypes.STRING(20),
        monthlyFeeCustom: DataTypes.BOOLEAN,
        freeStudy: DataTypes.BOOLEAN,
        zeroFeeReason: DataTypes.TEXT,
        remainingAmount: DataTypes.STRING(20),
        dueBalance: DataTypes.STRING(20),
        balance: DataTypes.STRING(20),
        feeFrequency: DataTypes.STRING(30),
        feesStatus: { type: DataTypes.STRING(30), defaultValue: 'Pending' },
        enrollmentStatus: DataTypes.STRING(30),
        paymentDate: DataTypes.STRING(30),
        address: DataTypes.TEXT,
        guardianName: DataTypes.STRING(100),
        guardianContact: DataTypes.STRING(30),
        fingerprintData: DataTypes.TEXT('long'),
        familyId: DataTypes.STRING(60),
        familyName: DataTypes.STRING(100),
        familyNo: DataTypes.STRING(50),
        familyContact: DataTypes.STRING(30),
        familyAddedAt: DataTypes.STRING(30),
        username: { type: DataTypes.STRING(100), unique: true },
        password: DataTypes.STRING(255),
        plainPassword: DataTypes.TEXT,
        role: { type: DataTypes.STRING(30), defaultValue: 'Student' }
    }, { engine: 'InnoDB', rowFormat: 'DYNAMIC' });
}

function defineTeacherModel(db) {
    return db.define('Teacher', {
        id: { type: DataTypes.STRING, primaryKey: true },
        employeeCode: DataTypes.STRING,
        fullName: DataTypes.STRING,
        profileImage: DataTypes.TEXT('long'),
        fatherName: DataTypes.STRING,
        dob: DataTypes.STRING,
        cnic: DataTypes.STRING,
        phone: DataTypes.STRING,
        email: { type: DataTypes.STRING, unique: true, allowNull: true },
        address: DataTypes.TEXT,
        qualification: DataTypes.STRING,
        campusName: DataTypes.STRING,
        gender: DataTypes.STRING,
        designation: DataTypes.STRING,
        subject: DataTypes.STRING,
        assignedSections: DataTypes.TEXT,
        salary: DataTypes.STRING,
        idCardFront: DataTypes.TEXT('long'),
        idCardBack: DataTypes.TEXT('long'),
        cvFile: DataTypes.TEXT('long'),
        bankName: DataTypes.STRING,
        bankAccountTitle: DataTypes.STRING,
        bankAccountNumber: DataTypes.STRING,
        bankBranch: DataTypes.STRING,
        schedule: DataTypes.TEXT('long'),
        username: { type: DataTypes.STRING, unique: true },
        password: DataTypes.STRING,
        plainPassword: DataTypes.STRING,
        groupKey: DataTypes.STRING,
        role: { type: DataTypes.STRING, defaultValue: 'Teacher' }
    }, { engine: 'InnoDB', rowFormat: 'DYNAMIC' });
}

function defineUserModel(db) {
    return db.define('User', {
        id: { type: DataTypes.STRING, primaryKey: true },
        profileId: { type: DataTypes.STRING, allowNull: false },
        fullName: DataTypes.STRING,
        campusName: DataTypes.STRING,
        email: { type: DataTypes.STRING, unique: true, allowNull: true },
        username: { type: DataTypes.STRING, unique: true, allowNull: false },
        password: { type: DataTypes.STRING, allowNull: false },
        plainPassword: DataTypes.STRING,
        groupKey: DataTypes.STRING,
        role: { type: DataTypes.STRING, allowNull: false },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
    }, { engine: 'InnoDB', rowFormat: 'DYNAMIC' });
}

function defineStaffModel(db) {
    return db.define('Staff', {
        id: { type: DataTypes.STRING, primaryKey: true },
        employeeCode: DataTypes.STRING,
        fullName: DataTypes.STRING,
        fatherName: DataTypes.STRING,
        dob: DataTypes.STRING,
        designation: DataTypes.STRING,
        cnic: DataTypes.STRING,
        phone: DataTypes.STRING,
        email: { type: DataTypes.STRING, unique: true, allowNull: true },
        address: DataTypes.TEXT,
        gender: DataTypes.STRING,
        salary: DataTypes.STRING,
        idCardFront: DataTypes.TEXT('long'),
        idCardBack: DataTypes.TEXT('long'),
        bankName: DataTypes.STRING,
        bankAccountTitle: DataTypes.STRING,
        bankAccountNumber: DataTypes.STRING,
        bankBranch: DataTypes.STRING,
        username: { type: DataTypes.STRING, unique: true, allowNull: true },
        password: DataTypes.STRING,
        plainPassword: DataTypes.STRING,
        groupKey: DataTypes.STRING,
        role: { type: DataTypes.STRING, defaultValue: 'Staff' }
    }, { engine: 'InnoDB', rowFormat: 'DYNAMIC' });
}

function defineFeePaymentModel(db) {
    return db.define('FeePayment', {
        challanNumber: { type: DataTypes.STRING, primaryKey: true },
        studentId: { type: DataTypes.STRING, allowNull: false },
        studentName: DataTypes.STRING,
        rollNo: DataTypes.STRING,
        classGrade: DataTypes.STRING,
        session: DataTypes.STRING,
        feeMonth: DataTypes.STRING,
        amount: DataTypes.DECIMAL(10, 2),
        status: { type: DataTypes.STRING, defaultValue: 'Pending' },
        paidAt: { type: DataTypes.DATE, allowNull: true },
        paymentDateLabel: DataTypes.STRING,
        paymentSource: DataTypes.STRING
    });
}

function defineFeeDueBalanceModel(db) {
    return db.define('FeeDueBalance', {
        studentId: { type: DataTypes.STRING, primaryKey: true },
        balance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        updatedAtLabel: DataTypes.STRING
    });
}

function defineClassFeeModel(db) {
    return db.define('ClassFee', {
        id: { type: DataTypes.STRING, primaryKey: true },
        className: { type: DataTypes.STRING, allowNull: false },
        monthlyFee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        annualCharges: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        feeFrequency: { type: DataTypes.STRING, defaultValue: 'Monthly' },
        feeMonth: DataTypes.STRING,
        feeYear: DataTypes.STRING,
        sessionFrom: DataTypes.STRING,
        sessionTo: DataTypes.STRING,
        updatedAtLabel: DataTypes.STRING
    });
}

function defineClassFeeHistoryModel(db) {
    return db.define('ClassFeeHistory', {
        id: { type: DataTypes.STRING, primaryKey: true },
        className: { type: DataTypes.STRING, allowNull: false },
        monthlyFee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        annualCharges: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        feeFrequency: { type: DataTypes.STRING, defaultValue: 'Monthly' },
        feeMonth: DataTypes.STRING,
        feeYear: DataTypes.STRING,
        sessionFrom: DataTypes.STRING,
        sessionTo: DataTypes.STRING,
        updatedAtLabel: DataTypes.STRING
    });
}

function defineStudentAttendanceModel(db) {
    return db.define('StudentAttendance', {
        id: { type: DataTypes.STRING, primaryKey: true },
        studentId: { type: DataTypes.STRING, allowNull: false },
        date: { type: DataTypes.STRING, allowNull: false },
        status: { type: DataTypes.STRING, allowNull: false }
    });
}

function defineTeacherAttendanceModel(db) {
    return db.define('TeacherAttendance', {
        id: { type: DataTypes.STRING, primaryKey: true },
        teacherId: { type: DataTypes.STRING, allowNull: false },
        date: { type: DataTypes.STRING, allowNull: false },
        status: { type: DataTypes.STRING, allowNull: false }
    });
}

function defineSpecialNoticeModel(db) {
    return db.define('SpecialNotice', {
        id: { type: DataTypes.STRING, primaryKey: true },
        title: { type: DataTypes.STRING, allowNull: false },
        message: { type: DataTypes.TEXT('long'), allowNull: false },
        targetPortals: { type: DataTypes.TEXT('long'), allowNull: false },
        audienceType: { type: DataTypes.STRING, allowNull: true, defaultValue: 'portal' },
        targetClassGrade: { type: DataTypes.STRING, allowNull: true },
        status: { type: DataTypes.STRING, defaultValue: 'draft' },
        executedAt: { type: DataTypes.DATE, allowNull: true },
        createdAtLabel: DataTypes.STRING
    });
}

function defineStudentPerformanceModel(db) {
    return db.define('StudentPerformance', {
        id: { type: DataTypes.STRING, primaryKey: true },
        studentId: { type: DataTypes.STRING, allowNull: false },
        studentName: { type: DataTypes.STRING, allowNull: false },
        classGrade: { type: DataTypes.STRING, allowNull: false },
        section: { type: DataTypes.STRING, allowNull: true },
        subject: { type: DataTypes.STRING, allowNull: false },
        examType: { type: DataTypes.STRING, allowNull: true },
        examYear: { type: DataTypes.STRING, allowNull: true },
        obtainedMarks: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
        totalMarks: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
        percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
        grade: { type: DataTypes.STRING, allowNull: true },
        skill: { type: DataTypes.STRING, allowNull: true },
        learningOutcome: { type: DataTypes.TEXT, allowNull: true },
        rating: { type: DataTypes.STRING, allowNull: true },
        excellentDescription: { type: DataTypes.TEXT, allowNull: true },
        satisfactoryDescription: { type: DataTypes.TEXT, allowNull: true },
        needsPracticeDescription: { type: DataTypes.TEXT, allowNull: true },
        performanceDate: { type: DataTypes.STRING, allowNull: true },
        performanceMonth: { type: DataTypes.STRING, allowNull: true },
        remarks: { type: DataTypes.TEXT, allowNull: true },
        updatedAtLabel: { type: DataTypes.STRING, allowNull: true }
    });
}

function defineMessageModel(db) {
    return db.define('Message', {
        id: { type: DataTypes.STRING, primaryKey: true },
        subject: { type: DataTypes.STRING, allowNull: false },
        body: { type: DataTypes.TEXT('long'), allowNull: false },
        targetRole: { type: DataTypes.STRING, allowNull: false },
        targetScope: { type: DataTypes.STRING, allowNull: false },
        campusName: { type: DataTypes.STRING, allowNull: true },
        classGrade: { type: DataTypes.STRING, allowNull: true },
        recipientId: { type: DataTypes.STRING, allowNull: true },
        recipientName: { type: DataTypes.STRING, allowNull: true },
        senderName: { type: DataTypes.STRING, allowNull: true },
        createdAtLabel: DataTypes.STRING
    });
}

function defineAppSettingModel(db) {
    return db.define('AppSetting', {
        settingKey: { type: DataTypes.STRING, primaryKey: true },
        settingValue: { type: DataTypes.TEXT('long'), allowNull: false }
    });
}

async function initializeDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'school_system'}\`;`);
    await connection.end();
}

async function ensureTableColumns(db, tableName, columnDefinitions) {
    const queryInterface = db.getQueryInterface();
    const table = await queryInterface.describeTable(tableName);

    for (const [columnName, definition] of Object.entries(columnDefinitions)) {
        if (!table[columnName]) {
            await queryInterface.addColumn(tableName, columnName, definition);
        }
    }
}

async function removeLegacyStudentPerformanceUniqueIndex(db) {
    const queryInterface = db.getQueryInterface();
    try {
        const indexes = await queryInterface.showIndex('StudentPerformances');
        for (const index of indexes) {
            const fields = (index.fields || []).map((field) => field.attribute || field.name).filter(Boolean);
            if (index.unique && fields.length === 2 && fields.includes('studentId') && fields.includes('subject')) {
                await queryInterface.removeIndex('StudentPerformances', index.name);
            }
        }
    } catch (_error) {
        // The table may not exist yet on first startup; sync will create it.
    }
}

async function ensureLegacySchema(db) {
    await ensureTableColumns(db, 'ClassFees', {
        annualCharges: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        feeMonth: { type: DataTypes.STRING, allowNull: true },
        feeYear: { type: DataTypes.STRING, allowNull: true },
        sessionFrom: { type: DataTypes.STRING, allowNull: true },
        sessionTo: { type: DataTypes.STRING, allowNull: true }
    });

    await ensureTableColumns(db, 'Students', {
        studentCode: { type: DataTypes.STRING, allowNull: true },
        fullName: { type: DataTypes.STRING, allowNull: true },
        profileImage: { type: DataTypes.TEXT('long'), allowNull: true },
        fatherName: { type: DataTypes.STRING, allowNull: true },
        dob: { type: DataTypes.STRING, allowNull: true },
        admissionDate: { type: DataTypes.STRING, allowNull: true },
        classGrade: { type: DataTypes.STRING, allowNull: true },
        section: { type: DataTypes.STRING, allowNull: true },
        subjects: { type: DataTypes.TEXT, allowNull: true },
        campusName: { type: DataTypes.STRING, allowNull: true },
        gender: { type: DataTypes.STRING, allowNull: true },
        parentPhone: { type: DataTypes.STRING, allowNull: true },
        email: { type: DataTypes.STRING, allowNull: true },
        rollNo: { type: DataTypes.STRING, allowNull: true },
        formB: { type: DataTypes.STRING, allowNull: true },
        monthlyFee: { type: DataTypes.STRING, allowNull: true },
        monthlyFeeCustom: { type: DataTypes.BOOLEAN, allowNull: true },
        freeStudy: { type: DataTypes.BOOLEAN, allowNull: true },
        zeroFeeReason: { type: DataTypes.TEXT, allowNull: true },
        remainingAmount: { type: DataTypes.STRING, allowNull: true },
        dueBalance: { type: DataTypes.STRING, allowNull: true },
        balance: { type: DataTypes.STRING, allowNull: true },
        feeFrequency: { type: DataTypes.STRING, allowNull: true },
        feesStatus: { type: DataTypes.STRING, allowNull: true },
        enrollmentStatus: { type: DataTypes.STRING, allowNull: true },
        paymentDate: { type: DataTypes.STRING, allowNull: true },
        address: { type: DataTypes.TEXT, allowNull: true },
        guardianName: { type: DataTypes.STRING, allowNull: true },
        guardianContact: { type: DataTypes.STRING, allowNull: true },
        fingerprintData: { type: DataTypes.TEXT('long'), allowNull: true },
        familyId: { type: DataTypes.STRING, allowNull: true },
        familyName: { type: DataTypes.STRING, allowNull: true },
        familyNo: { type: DataTypes.STRING, allowNull: true },
        familyContact: { type: DataTypes.STRING, allowNull: true },
        familyAddedAt: { type: DataTypes.STRING, allowNull: true },
        username: { type: DataTypes.STRING, allowNull: true },
        password: { type: DataTypes.STRING, allowNull: true },
        plainPassword: { type: DataTypes.STRING, allowNull: true },
        role: { type: DataTypes.STRING, allowNull: true }
    });

    await ensureTableColumns(db, 'Users', {
        fullName: { type: DataTypes.STRING, allowNull: true },
        campusName: { type: DataTypes.STRING, allowNull: true },
        email: { type: DataTypes.STRING, allowNull: true },
        username: { type: DataTypes.STRING, allowNull: false },
        password: { type: DataTypes.STRING, allowNull: false },
        plainPassword: { type: DataTypes.STRING, allowNull: true },
        groupKey: { type: DataTypes.STRING, allowNull: true },
        role: { type: DataTypes.STRING, allowNull: false },
        isActive: { type: DataTypes.BOOLEAN, allowNull: true }
    });

    await ensureTableColumns(db, 'Teachers', {
        employeeCode: { type: DataTypes.STRING, allowNull: true },
        fullName: { type: DataTypes.STRING, allowNull: true },
        profileImage: { type: DataTypes.TEXT('long'), allowNull: true },
        fatherName: { type: DataTypes.STRING, allowNull: true },
        dob: { type: DataTypes.STRING, allowNull: true },
        cnic: { type: DataTypes.STRING, allowNull: true },
        phone: { type: DataTypes.STRING, allowNull: true },
        email: { type: DataTypes.STRING, allowNull: true },
        address: { type: DataTypes.TEXT, allowNull: true },
        qualification: { type: DataTypes.STRING, allowNull: true },
        campusName: { type: DataTypes.STRING, allowNull: true },
        gender: { type: DataTypes.STRING, allowNull: true },
        designation: { type: DataTypes.STRING, allowNull: true },
        subject: { type: DataTypes.STRING, allowNull: true },
        assignedSections: { type: DataTypes.TEXT, allowNull: true },
        salary: { type: DataTypes.STRING, allowNull: true },
        idCardFront: { type: DataTypes.TEXT('long'), allowNull: true },
        idCardBack: { type: DataTypes.TEXT('long'), allowNull: true },
        cvFile: { type: DataTypes.TEXT('long'), allowNull: true },
        bankName: { type: DataTypes.STRING, allowNull: true },
        bankAccountTitle: { type: DataTypes.STRING, allowNull: true },
        bankAccountNumber: { type: DataTypes.STRING, allowNull: true },
        bankBranch: { type: DataTypes.STRING, allowNull: true },
        schedule: { type: DataTypes.TEXT('long'), allowNull: true },
        username: { type: DataTypes.STRING, allowNull: true },
        password: { type: DataTypes.STRING, allowNull: true },
        plainPassword: { type: DataTypes.STRING, allowNull: true },
        groupKey: { type: DataTypes.STRING, allowNull: true },
        role: { type: DataTypes.STRING, allowNull: true }
    });

    await ensureTableColumns(db, 'Staffs', {
        employeeCode: { type: DataTypes.STRING, allowNull: true },
        fullName: { type: DataTypes.STRING, allowNull: true },
        fatherName: { type: DataTypes.STRING, allowNull: true },
        dob: { type: DataTypes.STRING, allowNull: true },
        designation: { type: DataTypes.STRING, allowNull: true },
        cnic: { type: DataTypes.STRING, allowNull: true },
        phone: { type: DataTypes.STRING, allowNull: true },
        email: { type: DataTypes.STRING, allowNull: true },
        address: { type: DataTypes.TEXT, allowNull: true },
        gender: { type: DataTypes.STRING, allowNull: true },
        salary: { type: DataTypes.STRING, allowNull: true },
        idCardFront: { type: DataTypes.TEXT('long'), allowNull: true },
        idCardBack: { type: DataTypes.TEXT('long'), allowNull: true },
        bankName: { type: DataTypes.STRING, allowNull: true },
        bankAccountTitle: { type: DataTypes.STRING, allowNull: true },
        bankAccountNumber: { type: DataTypes.STRING, allowNull: true },
        bankBranch: { type: DataTypes.STRING, allowNull: true },
        username: { type: DataTypes.STRING, allowNull: true },
        password: { type: DataTypes.STRING, allowNull: true },
        plainPassword: { type: DataTypes.STRING, allowNull: true },
        groupKey: { type: DataTypes.STRING, allowNull: true },
        role: { type: DataTypes.STRING, allowNull: true }
    });

    await ensureTableColumns(db, 'Messages', {
        subject: { type: DataTypes.STRING, allowNull: false },
        body: { type: DataTypes.TEXT('long'), allowNull: false },
        targetRole: { type: DataTypes.STRING, allowNull: false },
        targetScope: { type: DataTypes.STRING, allowNull: false },
        campusName: { type: DataTypes.STRING, allowNull: true },
        classGrade: { type: DataTypes.STRING, allowNull: true },
        recipientId: { type: DataTypes.STRING, allowNull: true },
        recipientName: { type: DataTypes.STRING, allowNull: true },
        senderName: { type: DataTypes.STRING, allowNull: true },
        createdAtLabel: { type: DataTypes.STRING, allowNull: true }
    });

    await ensureTableColumns(db, 'SpecialNotices', {
        audienceType: { type: DataTypes.STRING, allowNull: true },
        targetClassGrade: { type: DataTypes.STRING, allowNull: true }
    });

    await ensureTableColumns(db, 'StudentPerformances', {
        section: { type: DataTypes.STRING, allowNull: true },
        examType: { type: DataTypes.STRING, allowNull: true },
        examYear: { type: DataTypes.STRING, allowNull: true },
        obtainedMarks: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
        totalMarks: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
        skill: { type: DataTypes.STRING, allowNull: true },
        learningOutcome: { type: DataTypes.TEXT, allowNull: true },
        rating: { type: DataTypes.STRING, allowNull: true },
        excellentDescription: { type: DataTypes.TEXT, allowNull: true },
        satisfactoryDescription: { type: DataTypes.TEXT, allowNull: true },
        needsPracticeDescription: { type: DataTypes.TEXT, allowNull: true },
        performanceDate: { type: DataTypes.STRING, allowNull: true },
        performanceMonth: { type: DataTypes.STRING, allowNull: true }
    });
    await removeLegacyStudentPerformanceUniqueIndex(db);
}

async function getDb() {
    if (sequelize) {
        return sequelize;
    }

    if (!startupPromise) {
        startupPromise = (async () => {
            await initializeDatabase();

            const db = new Sequelize(
                process.env.DB_NAME || 'school_system',
                process.env.DB_USER || 'root',
                process.env.DB_PASSWORD || '',
                {
                    host: process.env.DB_HOST || 'localhost',
                    port: Number(process.env.DB_PORT || 3306),
                    dialect: 'mysql',
                    logging: false
                }
            );

            defineStudentModel(db);
            defineTeacherModel(db);
            defineUserModel(db);
            defineStaffModel(db);
            defineFeePaymentModel(db);
            defineFeeDueBalanceModel(db);
            defineClassFeeModel(db);
            defineClassFeeHistoryModel(db);
            defineStudentAttendanceModel(db);
            defineStudentPerformanceModel(db);
            defineTeacherAttendanceModel(db);
            defineAppSettingModel(db);
            defineSpecialNoticeModel(db);
            defineMessageModel(db);

            await db.sync();
            await ensureLegacySchema(db);
            await syncAuthUsers(db);

            sequelize = db;
            return db;
        })().catch((error) => {
            startupPromise = null;
            throw error;
        });
    }

    return startupPromise;
}

module.exports = {
    DataTypes,
    Op,
    getDb
};
