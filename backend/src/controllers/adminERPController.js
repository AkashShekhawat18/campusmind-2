const prisma = require('../utils/prisma');

// Helper to handle Prisma errors gracefully (e.g., Uniqueness)
const handlePrismaError = (error, res, entityName) => {
  if (error.code === 'P2002') {
    return res.status(400).json({ error: `${entityName} with this unique field already exists.` });
  }
  console.error(`Error in ${entityName} operation:`, error);
  res.status(500).json({ error: `Server error processing ${entityName}` });
};

// ==========================================
// COLLEGES
// ==========================================
exports.getColleges = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit) || 50;
    if (limit > 200) limit = 200;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const colleges = await prisma.college.findMany({
      take: limit,
      skip,
      orderBy: { name: 'asc' }
    });
    res.json(colleges);
  } catch (error) {
    handlePrismaError(error, res, 'College');
  }
};

exports.createCollege = async (req, res) => {
  const { name, location } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const college = await prisma.college.create({ data: { name, location } });
    res.status(201).json(college);
  } catch (error) {
    handlePrismaError(error, res, 'College');
  }
};

exports.updateCollege = async (req, res) => {
  const { id } = req.params;
  const { name, location } = req.body;
  try {
    const college = await prisma.college.update({
      where: { id },
      data: { name, location }
    });
    res.json(college);
  } catch (error) {
    handlePrismaError(error, res, 'College');
  }
};

exports.deleteCollege = async (req, res) => {
  const { id } = req.params;
  const { confirmCascade } = req.query;
  try {
    const deptsCount = await prisma.department.count({ where: { collegeId: id } });
    if (!confirmCascade && deptsCount > 0) {
      return res.status(400).json({
        requiresConfirmation: true,
        message: `Deleting this College will also delete ${deptsCount} Departments.`
      });
    }
    await prisma.college.delete({ where: { id } });
    res.json({ message: 'College deleted successfully' });
  } catch (error) {
    handlePrismaError(error, res, 'College');
  }
};

// ==========================================
// DEPARTMENTS
// ==========================================
exports.getDepartments = async (req, res) => {
  const { collegeId } = req.query;
  try {
    let limit = parseInt(req.query.limit) || 50;
    if (limit > 200) limit = 200;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const where = collegeId ? { collegeId } : {};
    const departments = await prisma.department.findMany({
      take: limit,
      skip,
      where,
      orderBy: { name: 'asc' }
    });
    res.json(departments);
  } catch (error) {
    handlePrismaError(error, res, 'Department');
  }
};

exports.createDepartment = async (req, res) => {
  const { name, collegeId } = req.body;
  if (!name || !collegeId) return res.status(400).json({ error: 'Name and College ID are required' });
  try {
    const college = await prisma.college.findUnique({ where: { id: collegeId } });
    if (!college) return res.status(400).json({ error: 'Referenced College does not exist' });
    const dept = await prisma.department.create({ data: { name, collegeId } });
    res.status(201).json(dept);
  } catch (error) {
    handlePrismaError(error, res, 'Department');
  }
};

exports.updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name, collegeId } = req.body;
  try {
    if (collegeId) {
      const college = await prisma.college.findUnique({ where: { id: collegeId } });
      if (!college) return res.status(400).json({ error: 'Referenced College does not exist' });
    }
    const dept = await prisma.department.update({
      where: { id },
      data: { name, collegeId }
    });
    res.json(dept);
  } catch (error) {
    handlePrismaError(error, res, 'Department');
  }
};

exports.deleteDepartment = async (req, res) => {
  const { id } = req.params;
  const { confirmCascade } = req.query;
  try {
    const branches = await prisma.branch.count({ where: { departmentId: id } });
    const programs = await prisma.program.count({ where: { departmentId: id } });
    if (!confirmCascade && (branches > 0 || programs > 0)) {
      return res.status(400).json({
        requiresConfirmation: true,
        message: `Deleting this Department will also delete ${branches} Branches and ${programs} Programs.`
      });
    }
    await prisma.department.delete({ where: { id } });
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    handlePrismaError(error, res, 'Department');
  }
};

// ==========================================
// BRANCHES
// ==========================================
exports.getBranches = async (req, res) => {
  const { departmentId } = req.query;
  try {
    let limit = parseInt(req.query.limit) || 50;
    if (limit > 200) limit = 200;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const where = departmentId ? { departmentId } : {};
    const branches = await prisma.branch.findMany({
      take: limit,
      skip,
      where,
      orderBy: { name: 'asc' }
    });
    res.json(branches);
  } catch (error) {
    handlePrismaError(error, res, 'Branch');
  }
};

exports.createBranch = async (req, res) => {
  const { name, departmentId } = req.body;
  if (!name || !departmentId) return res.status(400).json({ error: 'Name and Department ID are required' });
  try {
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) return res.status(400).json({ error: 'Referenced Department does not exist' });
    const branch = await prisma.branch.create({ data: { name, departmentId } });
    res.status(201).json(branch);
  } catch (error) {
    handlePrismaError(error, res, 'Branch');
  }
};

exports.updateBranch = async (req, res) => {
  const { id } = req.params;
  const { name, departmentId } = req.body;
  try {
    if (departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!dept) return res.status(400).json({ error: 'Referenced Department does not exist' });
    }
    const branch = await prisma.branch.update({ where: { id }, data: { name, departmentId } });
    res.json(branch);
  } catch (error) {
    handlePrismaError(error, res, 'Branch');
  }
};

exports.deleteBranch = async (req, res) => {
  const { id } = req.params;
  const { confirmCascade } = req.query;
  try {
    const subjects = await prisma.subject.count({ where: { branchId: id } });
    if (!confirmCascade && subjects > 0) {
      return res.status(400).json({
        requiresConfirmation: true,
        message: `Deleting this Branch will affect ${subjects} Subjects.`
      });
    }
    await prisma.branch.delete({ where: { id } });
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    handlePrismaError(error, res, 'Branch');
  }
};

// ==========================================
// PROGRAMS
// ==========================================
exports.getPrograms = async (req, res) => {
  const { departmentId } = req.query;
  try {
    let limit = parseInt(req.query.limit) || 50;
    if (limit > 200) limit = 200;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const where = departmentId ? { departmentId } : {};
    const programs = await prisma.program.findMany({
      take: limit,
      skip,
      where,
      orderBy: { name: 'asc' }
    });
    res.json(programs);
  } catch (error) {
    handlePrismaError(error, res, 'Program');
  }
};

exports.createProgram = async (req, res) => {
  const { name, departmentId } = req.body;
  if (!name || !departmentId) return res.status(400).json({ error: 'Name and Department ID are required' });
  try {
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) return res.status(400).json({ error: 'Referenced Department does not exist' });
    const program = await prisma.program.create({ data: { name, departmentId } });
    res.status(201).json(program);
  } catch (error) {
    handlePrismaError(error, res, 'Program');
  }
};

exports.updateProgram = async (req, res) => {
  const { id } = req.params;
  const { name, departmentId } = req.body;
  try {
    if (departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!dept) return res.status(400).json({ error: 'Referenced Department does not exist' });
    }
    const program = await prisma.program.update({ where: { id }, data: { name, departmentId } });
    res.json(program);
  } catch (error) {
    handlePrismaError(error, res, 'Program');
  }
};

exports.deleteProgram = async (req, res) => {
  const { id } = req.params;
  const { confirmCascade } = req.query;
  try {
    const semesters = await prisma.semester.count({ where: { programId: id } });
    if (!confirmCascade && semesters > 0) {
      return res.status(400).json({
        requiresConfirmation: true,
        message: `Deleting this Program will also delete ${semesters} Semesters.`
      });
    }
    await prisma.program.delete({ where: { id } });
    res.json({ message: 'Program deleted successfully' });
  } catch (error) {
    handlePrismaError(error, res, 'Program');
  }
};

// ==========================================
// ACADEMIC YEARS
// ==========================================
exports.getAcademicYears = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit) || 50;
    if (limit > 200) limit = 200;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const years = await prisma.academicYear.findMany({
      take: limit,
      skip,
      orderBy: { year: 'desc' }
    });
    res.json(years);
  } catch (error) {
    handlePrismaError(error, res, 'AcademicYear');
  }
};

exports.createAcademicYear = async (req, res) => {
  const { year, isCurrent } = req.body;
  if (!year) return res.status(400).json({ error: 'Year is required' });
  try {
    const ay = await prisma.academicYear.create({ data: { year, isCurrent: !!isCurrent } });
    res.status(201).json(ay);
  } catch (error) {
    handlePrismaError(error, res, 'AcademicYear');
  }
};

exports.updateAcademicYear = async (req, res) => {
  const { id } = req.params;
  const { year, isCurrent } = req.body;
  try {
    const ay = await prisma.academicYear.update({ where: { id }, data: { year, isCurrent } });
    res.json(ay);
  } catch (error) {
    handlePrismaError(error, res, 'AcademicYear');
  }
};

exports.deleteAcademicYear = async (req, res) => {
  const { id } = req.params;
  const { confirmCascade } = req.query;
  try {
    const semesters = await prisma.semester.count({ where: { academicYearId: id } });
    if (!confirmCascade && semesters > 0) {
      return res.status(400).json({
        requiresConfirmation: true,
        message: `Deleting this Academic Year will affect ${semesters} Semesters.`
      });
    }
    await prisma.academicYear.delete({ where: { id } });
    res.json({ message: 'Academic Year deleted successfully' });
  } catch (error) {
    handlePrismaError(error, res, 'AcademicYear');
  }
};

// ==========================================
// SEMESTERS
// ==========================================
exports.getSemesters = async (req, res) => {
  const { programId, academicYearId } = req.query;
  try {
    let limit = parseInt(req.query.limit) || 50;
    if (limit > 200) limit = 200;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const where = {};
    if (programId) where.programId = programId;
    if (academicYearId) where.academicYearId = academicYearId;
    const semesters = await prisma.semester.findMany({
      take: limit,
      skip,
      where,
      orderBy: { number: 'asc' }
    });
    res.json(semesters);
  } catch (error) {
    handlePrismaError(error, res, 'Semester');
  }
};

exports.createSemester = async (req, res) => {
  const { number, programId, academicYearId } = req.body;
  if (number === undefined || !programId || !academicYearId) return res.status(400).json({ error: 'Number, Program ID, and Academic Year ID are required' });
  try {
    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program) return res.status(400).json({ error: 'Referenced Program does not exist' });
    const ay = await prisma.academicYear.findUnique({ where: { id: academicYearId } });
    if (!ay) return res.status(400).json({ error: 'Referenced Academic Year does not exist' });

    const sem = await prisma.semester.create({ data: { number: parseInt(number), programId, academicYearId } });
    res.status(201).json(sem);
  } catch (error) {
    handlePrismaError(error, res, 'Semester');
  }
};

exports.updateSemester = async (req, res) => {
  const { id } = req.params;
  const { number, programId, academicYearId } = req.body;
  try {
    if (programId) {
      const program = await prisma.program.findUnique({ where: { id: programId } });
      if (!program) return res.status(400).json({ error: 'Referenced Program does not exist' });
    }
    if (academicYearId) {
      const ay = await prisma.academicYear.findUnique({ where: { id: academicYearId } });
      if (!ay) return res.status(400).json({ error: 'Referenced Academic Year does not exist' });
    }
    const sem = await prisma.semester.update({ 
      where: { id }, 
      data: { number: number !== undefined ? parseInt(number) : undefined, programId, academicYearId } 
    });
    res.json(sem);
  } catch (error) {
    handlePrismaError(error, res, 'Semester');
  }
};

exports.deleteSemester = async (req, res) => {
  const { id } = req.params;
  const { confirmCascade } = req.query;
  try {
    const sections = await prisma.section.count({ where: { semesterId: id } });
    const subjects = await prisma.subject.count({ where: { semesterId: id } });
    if (!confirmCascade && (sections > 0 || subjects > 0)) {
      return res.status(400).json({
        requiresConfirmation: true,
        message: `Deleting this Semester will also delete ${sections} Sections and affect ${subjects} Subjects.`
      });
    }
    await prisma.semester.delete({ where: { id } });
    res.json({ message: 'Semester deleted successfully' });
  } catch (error) {
    handlePrismaError(error, res, 'Semester');
  }
};

// ==========================================
// SECTIONS
// ==========================================
exports.getSections = async (req, res) => {
  const { semesterId } = req.query;
  try {
    let limit = parseInt(req.query.limit) || 50;
    if (limit > 200) limit = 200;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const where = semesterId ? { semesterId } : {};
    const sections = await prisma.section.findMany({
      take: limit,
      skip,
      where,
      orderBy: { name: 'asc' }
    });
    res.json(sections);
  } catch (error) {
    handlePrismaError(error, res, 'Section');
  }
};

exports.createSection = async (req, res) => {
  const { name, semesterId } = req.body;
  if (!name || !semesterId) return res.status(400).json({ error: 'Name and Semester ID are required' });
  try {
    const sem = await prisma.semester.findUnique({ where: { id: semesterId } });
    if (!sem) return res.status(400).json({ error: 'Referenced Semester does not exist' });
    const section = await prisma.section.create({ data: { name, semesterId } });
    res.status(201).json(section);
  } catch (error) {
    handlePrismaError(error, res, 'Section');
  }
};

exports.updateSection = async (req, res) => {
  const { id } = req.params;
  const { name, semesterId } = req.body;
  try {
    if (semesterId) {
      const sem = await prisma.semester.findUnique({ where: { id: semesterId } });
      if (!sem) return res.status(400).json({ error: 'Referenced Semester does not exist' });
    }
    const section = await prisma.section.update({ where: { id }, data: { name, semesterId } });
    res.json(section);
  } catch (error) {
    handlePrismaError(error, res, 'Section');
  }
};

exports.deleteSection = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.section.delete({ where: { id } });
    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    handlePrismaError(error, res, 'Section');
  }
};

// ==========================================
// SUBJECTS
// ==========================================
exports.getSubjects = async (req, res) => {
  const { semesterId, branchId } = req.query;
  try {
    let limit = parseInt(req.query.limit) || 50;
    if (limit > 200) limit = 200;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const where = {};
    if (semesterId) where.semesterId = semesterId;
    if (branchId) where.branchId = branchId;
    const subjects = await prisma.subject.findMany({
      take: limit,
      skip,
      where,
      orderBy: { name: 'asc' }
    });
    res.json(subjects);
  } catch (error) {
    handlePrismaError(error, res, 'Subject');
  }
};

exports.createSubject = async (req, res) => {
  const { name, code, credits, semesterId, branchId } = req.body;
  if (!name || !code) return res.status(400).json({ error: 'Name and Code are required' });
  try {
    if (semesterId) {
      const sem = await prisma.semester.findUnique({ where: { id: semesterId } });
      if (!sem) return res.status(400).json({ error: 'Referenced Semester does not exist' });
    }
    if (branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      if (!branch) return res.status(400).json({ error: 'Referenced Branch does not exist' });
    }
    const subject = await prisma.subject.create({ 
      data: { name, code, credits: parseInt(credits) || 0, semesterId, branchId } 
    });
    res.status(201).json(subject);
  } catch (error) {
    handlePrismaError(error, res, 'Subject');
  }
};

exports.updateSubject = async (req, res) => {
  const { id } = req.params;
  const { name, code, credits, semesterId, branchId } = req.body;
  try {
    if (semesterId) {
      const sem = await prisma.semester.findUnique({ where: { id: semesterId } });
      if (!sem) return res.status(400).json({ error: 'Referenced Semester does not exist' });
    }
    if (branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      if (!branch) return res.status(400).json({ error: 'Referenced Branch does not exist' });
    }
    const subject = await prisma.subject.update({ 
      where: { id }, 
      data: { name, code, credits: credits !== undefined ? parseInt(credits) : undefined, semesterId, branchId } 
    });
    res.json(subject);
  } catch (error) {
    handlePrismaError(error, res, 'Subject');
  }
};

exports.deleteSubject = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.subject.delete({ where: { id } });
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    handlePrismaError(error, res, 'Subject');
  }
};
