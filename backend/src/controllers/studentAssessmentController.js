const prisma = require('../utils/prisma');

// Get assessments assigned to the student (simplification: fetch ACTIVE status, optionally filter by class/section later)
const getStudentAssessments = async (req, res) => {
  try {
    const studentId = req.user.id;
    // In a full implementation, we filter by class/section. For now, fetch ACTIVE assessments
    // plus those the student has already SUBMITTED or GRADED
    
    const assessments = await prisma.assessment.findMany({
      where: {
        status: { in: ['ACTIVE', 'SCHEDULED', 'COMPLETED'] }, // Student sees scheduled to know what's coming
      },
      include: {
        _count: {
          select: { questions: true }
        },
        submissions: {
          where: { studentId }
        },
        teacher: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(assessments);
  } catch (error) {
    console.error('Error fetching student assessments:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getAssessmentForAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: {
              select: { id: true, text: true, order: true } // Exclude isCorrect!
            }
          },
          orderBy: { order: 'asc' }
        },
        submissions: {
          where: { studentId }
        }
      }
    });

    if (!assessment) return res.status(404).json({ error: 'Not found' });
    if (assessment.status === 'DRAFT') return res.status(403).json({ error: 'Not available' });

    res.status(200).json(assessment);
  } catch (error) {
    console.error('Error fetching assessment attempt:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const submitAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;
    const { answers } = req.body; // Array of { questionId, selectedOptionId, textResponse }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers payload missing or invalid' });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        questions: {
          include: { options: true }
        }
      }
    });

    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    if (assessment.status !== 'ACTIVE') return res.status(403).json({ error: 'Assessment is not active' });

    // Check if already submitted
    const existing = await prisma.assessmentSubmission.findUnique({
      where: {
        assessmentId_studentId: { assessmentId: id, studentId }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'You have already submitted this assessment' });
    }

    let totalScore = 0;
    const answerData = [];
    let needsManualGrading = false;

    for (const ans of answers) {
      const q = assessment.questions.find(q => q.id === ans.questionId);
      if (!q) continue;

      let isCorrect = null;
      let marksAwarded = 0;

      // Auto-grade MCQs
      if (q.type === 'quiz' || q.type === 'mcq' || q.options.length > 0) {
        const correctOpt = q.options.find(o => o.isCorrect);
        // Sometimes correct answer is stored in q.correctAnswer
        const storedCorrectAnswer = q.correctAnswer || (correctOpt ? correctOpt.id : null) || (correctOpt ? correctOpt.text : null);

        if (correctOpt && ans.selectedOptionId === correctOpt.id) {
          isCorrect = true;
          marksAwarded = q.marks;
        } else if (ans.textResponse && storedCorrectAnswer && ans.textResponse.trim().toLowerCase() === storedCorrectAnswer.trim().toLowerCase()) {
          isCorrect = true;
          marksAwarded = q.marks;
        } else if (ans.selectedOptionId || ans.textResponse) {
          isCorrect = false;
        }
      } else {
        // Subjective question
        needsManualGrading = true;
      }

      totalScore += marksAwarded;

      answerData.push({
        questionId: q.id,
        selectedOptionId: ans.selectedOptionId || null,
        textResponse: ans.textResponse || null,
        isCorrect,
        marksAwarded,
      });
    }

    // Save submission transactionally
    const submission = await prisma.$transaction(async (tx) => {
      const sub = await tx.assessmentSubmission.create({
        data: {
          assessmentId: id,
          studentId,
          status: needsManualGrading ? 'SUBMITTED' : 'GRADED',
          totalScore,
          gradedBy: needsManualGrading ? null : 'AI',
        }
      });

      if (answerData.length > 0) {
        await tx.assessmentSubmissionAnswer.createMany({
          data: answerData.map(a => ({ ...a, submissionId: sub.id }))
        });
      }

      return sub;
    });

    res.status(200).json({ message: 'Submission successful', submission });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getStudentAssessments,
  getAssessmentForAttempt,
  submitAssessment
};
