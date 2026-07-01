const express = require('express');
const router = express.Router();
const erpController = require('../controllers/adminERPController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');

// Protect all ERP routes and require ADMIN role
router.use(protect);
router.use(requireRole('ADMIN'));

// Colleges
router.get('/colleges', erpController.getColleges);
router.post('/colleges', erpController.createCollege);
router.put('/colleges/:id', erpController.updateCollege);
router.delete('/colleges/:id', erpController.deleteCollege);

// Departments
router.get('/departments', erpController.getDepartments);
router.post('/departments', erpController.createDepartment);
router.put('/departments/:id', erpController.updateDepartment);
router.delete('/departments/:id', erpController.deleteDepartment);

// Branches
router.get('/branches', erpController.getBranches);
router.post('/branches', erpController.createBranch);
router.put('/branches/:id', erpController.updateBranch);
router.delete('/branches/:id', erpController.deleteBranch);

// Programs
router.get('/programs', erpController.getPrograms);
router.post('/programs', erpController.createProgram);
router.put('/programs/:id', erpController.updateProgram);
router.delete('/programs/:id', erpController.deleteProgram);

// Academic Years
router.get('/academicyears', erpController.getAcademicYears);
router.post('/academicyears', erpController.createAcademicYear);
router.put('/academicyears/:id', erpController.updateAcademicYear);
router.delete('/academicyears/:id', erpController.deleteAcademicYear);

// Semesters
router.get('/semesters', erpController.getSemesters);
router.post('/semesters', erpController.createSemester);
router.put('/semesters/:id', erpController.updateSemester);
router.delete('/semesters/:id', erpController.deleteSemester);

// Sections
router.get('/sections', erpController.getSections);
router.post('/sections', erpController.createSection);
router.put('/sections/:id', erpController.updateSection);
router.delete('/sections/:id', erpController.deleteSection);

// Subjects
router.get('/subjects', erpController.getSubjects);
router.post('/subjects', erpController.createSubject);
router.put('/subjects/:id', erpController.updateSubject);
router.delete('/subjects/:id', erpController.deleteSubject);

module.exports = router;
