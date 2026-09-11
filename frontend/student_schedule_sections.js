(function () {
    'use strict';

    function clean(value) {
        return String(value ?? '').trim();
    }

    function normalize(value) {
        return clean(value).toLowerCase().replace(/\s+/g, ' ');
    }

    function splitClassGrade(value) {
        const raw = clean(value);
        const match = raw.match(/^(.*?)\s*\(([^()]+)\)\s*$/);
        return match
            ? { classGrade: clean(match[1]), section: clean(match[2]) }
            : { classGrade: raw, section: '' };
    }

    function classGrade(record) {
        return splitClassGrade(record?.classGrade || record?.className || record?.name || '').classGrade;
    }

    function section(record) {
        return clean(record?.section || record?.classSection || record?.sectionName || splitClassGrade(record?.classGrade || record?.className || record?.name || '').section);
    }

    function format(classValue, sectionValue) {
        const grade = clean(classValue);
        const sectionName = clean(sectionValue);
        return sectionName ? `${grade} - Section ${sectionName}` : grade;
    }

    function compare(left, right) {
        if (typeof window.compareStudentClassNames === 'function') {
            return window.compareStudentClassNames(left, right);
        }
        return clean(left).localeCompare(clean(right), undefined, { numeric: true, sensitivity: 'base' });
    }

    function getClassOptions(students = [], classes = [], include = []) {
        return [...new Set([
            ...classes.map(classGrade),
            ...students.map(classGrade),
            ...include.map((value) => splitClassGrade(value).classGrade)
        ].filter(Boolean))].sort(compare);
    }

    function campusMatches(record, campus) {
        if (!clean(campus)) return true;
        return normalize(record?.campusName || record?.branchName || record?.campus || '') === normalize(campus);
    }

    function getSectionOptions(classValue, students = [], classes = [], campus = '') {
        const wantedClass = normalize(splitClassGrade(classValue).classGrade);
        if (!wantedClass) return [];
        return [...new Set([
            ...classes.filter((record) => campusMatches(record, campus) && normalize(classGrade(record)) === wantedClass).map(section),
            ...students.filter((record) => campusMatches(record, campus) && normalize(classGrade(record)) === wantedClass).map(section)
        ].filter(Boolean))].sort((left, right) => clean(left).localeCompare(clean(right), undefined, { numeric: true, sensitivity: 'base' }));
    }

    function getRecords(key) {
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (_error) {
            return [];
        }
    }

    function getAllClassOptions(include = []) {
        return getClassOptions(
            getRecords('eduCore_students'),
            getRecords('eduCore_classes'),
            include
        );
    }

    function getAllSectionOptions(classValue, campus = '', include = []) {
        const students = getRecords('eduCore_students');
        const classes = getRecords('eduCore_classes');
        const sections = getSectionOptions(classValue, students, classes, campus);
        include.forEach((value) => {
            const parsed = splitClassGrade(value?.classGrade || value?.className || value || '');
            const sectionName = clean(value?.section || parsed.section);
            if (sectionName && normalize(parsed.classGrade) === normalize(splitClassGrade(classValue).classGrade) && !sections.some((item) => normalize(item) === normalize(sectionName))) {
                sections.push(sectionName);
            }
        });
        return sections.sort((left, right) => clean(left).localeCompare(clean(right), undefined, { numeric: true, sensitivity: 'base' }));
    }

    function populateClassSelect(select, selected = '', include = []) {
        if (!select) return;
        const wanted = splitClassGrade(selected).classGrade;
        const classes = getAllClassOptions([wanted, ...include]);
        select.innerHTML = '<option value="">Select Class</option>' + classes
            .map((classValue) => `<option value="${escapeHtml(classValue)}">${escapeHtml(classValue)}</option>`)
            .join('');
        select.value = wanted;
        if (wanted && select.value !== wanted) {
            select.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(wanted)}">${escapeHtml(wanted)}</option>`);
            select.value = wanted;
        }
    }

    function populateSectionSelect(sectionSelect, classValue = '', campus = '', selected = '', include = []) {
        if (!sectionSelect) return;
        const wanted = clean(selected || splitClassGrade(classValue).section);
        const sections = getAllSectionOptions(classValue, campus, include);
        if (wanted && !sections.some((item) => normalize(item) === normalize(wanted))) sections.push(wanted);
        const options = sections.length ? sections : ['General'];
        sectionSelect.innerHTML = options
            .map((sectionValue) => `<option value="${escapeHtml(sectionValue)}">${escapeHtml(sectionValue)}</option>`)
            .join('');
        sectionSelect.disabled = !clean(classValue);
        sectionSelect.value = wanted || options[0] || '';
    }

    function bindClassSectionControls({ classSelect, sectionSelect, campusSelect, include = [], onChange } = {}) {
        if (!classSelect || !sectionSelect) return;
        const refresh = (selectedSection = '') => {
            populateSectionSelect(sectionSelect, classSelect.value, campusSelect?.value || '', selectedSection, include);
            if (typeof onChange === 'function') onChange();
        };
        if (!classSelect.dataset.sectionControlBound) {
            classSelect.dataset.sectionControlBound = '1';
            classSelect.addEventListener('change', () => refresh());
        }
        if (campusSelect && !campusSelect.dataset.sectionControlBound) {
            campusSelect.dataset.sectionControlBound = '1';
            campusSelect.addEventListener('change', () => refresh(sectionSelect.value));
        }
        refresh(sectionSelect.value);
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[character]));
    }

    function matches(record, classValue = '', sectionValue = '', campus = '') {
        const selectedClass = normalize(splitClassGrade(classValue).classGrade);
        const selectedSection = normalize(sectionValue);
        return (!selectedClass || normalize(classGrade(record)) === selectedClass)
            && (!selectedSection || normalize(section(record)) === selectedSection)
            && campusMatches(record, campus);
    }

    window.studentSchedulingSections = {
        clean,
        normalize,
        splitClassGrade,
        classGrade,
        section,
        format,
        compare,
        getClassOptions,
        getSectionOptions,
        getRecords,
        getAllClassOptions,
        getAllSectionOptions,
        populateClassSelect,
        populateSectionSelect,
        bindClassSectionControls,
        matches
    };
})();
