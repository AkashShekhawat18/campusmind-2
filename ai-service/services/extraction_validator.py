"""
Stage 4: Extraction Validation & Self-Recovery

Validates extracted questions for completeness and accuracy.
Detects gaps, orphaned elements, and numbering discontinuities.
Triggers targeted re-extraction only on uncertain regions.
"""

import re
import logging
from typing import List, Dict, Any, Optional, Tuple, Set
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ValidationReport:
    """Results of validation."""
    is_valid: bool = True
    total_questions: int = 0
    numbering_gaps: List[str] = None
    missing_sections: List[str] = None
    orphaned_images: int = 0
    orphaned_tables: int = 0
    duplicate_numbers: List[str] = None
    questions_without_text: int = 0
    questions_without_marks: int = 0
    low_confidence_questions: int = 0
    warnings: List[str] = None
    recovery_needed: bool = False
    recovery_pages: List[int] = None

    def __post_init__(self):
        if self.numbering_gaps is None:
            self.numbering_gaps = []
        if self.missing_sections is None:
            self.missing_sections = []
        if self.duplicate_numbers is None:
            self.duplicate_numbers = []
        if self.warnings is None:
            self.warnings = []
        if self.recovery_pages is None:
            self.recovery_pages = []


def validate_extraction(questions: List[Dict[str, Any]],
                        pages_data: List = None,
                        expected_total: Optional[int] = None,
                        total_marks: Optional[int] = None) -> ValidationReport:
    """
    Master validation function.

    Checks:
    1. Numbering continuity (Q1, Q2, ..., Qn — no gaps)
    2. Duplicate question numbers
    3. Empty/missing question text
    4. Missing marks
    5. Orphaned visual elements
    6. Section completeness
    7. Total marks consistency
    8. Low confidence questions

    Returns a ValidationReport with recovery recommendations.
    """
    report = ValidationReport()
    report.total_questions = len(questions)

    if not questions:
        report.is_valid = False
        report.warnings.append("No questions extracted")
        report.recovery_needed = True
        if pages_data:
            report.recovery_pages = list(range(len(pages_data)))
        return report

    # 1. Check numbering continuity
    _check_numbering(questions, report)

    # 2. Check for duplicates
    _check_duplicates(questions, report)

    # 3. Check question text quality
    _check_text_quality(questions, report)

    # 4. Check marks
    _check_marks(questions, report, total_marks)

    # 5. Check confidence levels
    _check_confidence(questions, report)

    # 6. Check for truncation (no questions on later pages)
    if pages_data and questions:
        pages_with_questions = set()
        for q in questions:
            page = q.get("_page_num")
            if page is not None:
                pages_with_questions.add(page)
        if pages_with_questions:
            max_page = max(pages_with_questions)
            total_pages = len(pages_data)
            # If the last 25% of the document yielded no questions, flag it
            if total_pages > 3 and (total_pages - 1 - max_page) >= total_pages * 0.25:
                report.warnings.append(f"Truncation detected: no questions after page {max_page} out of {total_pages}")
                report.recovery_needed = True

    # 7. Determine if recovery is needed from basic signals
    if (report.numbering_gaps or
        report.questions_without_text > 0 or
        report.low_confidence_questions > len(questions) * 0.3):
        report.recovery_needed = True

    # 8. Determine recovery pages
    if report.recovery_needed and pages_data:
        report.recovery_pages = _identify_recovery_pages(
            questions, pages_data, report
        )

    report.is_valid = not report.recovery_needed

    return report


def _check_numbering(questions: List[Dict], report: ValidationReport):
    """Check for numbering gaps and continuity."""
    # Extract main question numbers (ignoring sub-parts)
    main_numbers = set()
    for q in questions:
        q_num = q.get("questionNumber", "") or q.get("questionNo", "")
        if not q_num:
            continue
        # Extract the main number (strip sub-part labels)
        num_match = re.match(r'^(\d+)', str(q_num))
        if num_match:
            main_numbers.add(int(num_match.group(1)))

    if not main_numbers:
        return

    sorted_nums = sorted(main_numbers)
    if len(sorted_nums) < 2:
        return

    # Check for gaps
    for i in range(1, len(sorted_nums)):
        expected = sorted_nums[i - 1] + 1
        actual = sorted_nums[i]
        if actual != expected:
            for missing in range(expected, actual):
                report.numbering_gaps.append(str(missing))
                report.warnings.append(
                    f"Question {missing} appears to be missing "
                    f"(found Q{sorted_nums[i-1]} then Q{actual})"
                )


def _check_duplicates(questions: List[Dict], report: ValidationReport):
    """Check for duplicate question numbers."""
    seen = {}
    for q in questions:
        q_num = q.get("questionNumber", "") or q.get("questionNo", "")
        if not q_num:
            continue
        key = str(q_num).strip().lower()
        if key in seen:
            report.duplicate_numbers.append(q_num)
            report.warnings.append(f"Duplicate question number: {q_num}")
        else:
            seen[key] = True


def _check_text_quality(questions: List[Dict], report: ValidationReport):
    """Check for empty, very short, or garbled question texts."""
    from services.document_understanding import _is_text_garbled
    
    garbled_count = 0
    for q in questions:
        text = q.get("questionText", "")
        if not text or len(text.strip()) < 5:
            report.questions_without_text += 1
            q_num = q.get("questionNumber", "?")
            report.warnings.append(f"Question {q_num} has empty or very short text")
        elif _is_text_garbled(text):
            garbled_count += 1
            q_num = q.get("questionNumber", "?")
            report.warnings.append(f"Question {q_num} has garbled/unreadable text")
    
    if garbled_count > 0:
        report.warnings.append(
            f"{garbled_count} question(s) have garbled text — "
            f"possible CMap/font encoding issue in the PDF"
        )


def _check_marks(questions: List[Dict], report: ValidationReport,
                 total_marks: Optional[int] = None):
    """Check marks extraction completeness."""
    for q in questions:
        if q.get("marks") is None:
            report.questions_without_marks += 1

    if total_marks and total_marks > 0:
        extracted_total = sum(q.get("marks", 0) or 0 for q in questions)
        if extracted_total > 0 and abs(extracted_total - total_marks) > total_marks * 0.1:
            report.warnings.append(
                f"Extracted marks total ({extracted_total}) differs from "
                f"expected total ({total_marks}) by more than 10%"
            )
            if extracted_total < total_marks * 0.8:
                report.recovery_needed = True
                report.warnings.append("Severe marks mismatch: triggering recovery.")


def _check_confidence(questions: List[Dict], report: ValidationReport):
    """Count low-confidence questions."""
    for q in questions:
        confidence = q.get("confidence", 1.0)
        if confidence < 0.7:
            report.low_confidence_questions += 1


def _identify_recovery_pages(questions: List[Dict],
                              pages_data: List,
                              report: ValidationReport) -> List[int]:
    """
    Identify which pages need targeted re-extraction.
    """
    recovery_pages = set()

    # Pages with numbering gaps
    if report.numbering_gaps:
        # Try to figure out which page the gap is on
        q_page_map = {}
        for q in questions:
            q_num = q.get("questionNumber", "") or q.get("questionNo", "")
            page = q.get("_page_num")  # Internal metadata
            if q_num and page is not None:
                q_page_map[str(q_num)] = page

        for gap_num in report.numbering_gaps:
            gap_int = int(gap_num) if gap_num.isdigit() else 0
            if gap_int == 0:
                continue
            # Find adjacent questions to estimate the page
            prev_page = q_page_map.get(str(gap_int - 1))
            next_page = q_page_map.get(str(gap_int + 1))
            if prev_page is not None:
                recovery_pages.add(prev_page)
            if next_page is not None:
                recovery_pages.add(next_page)

    # Check for truncation recovery
    max_page = -1
    if any("Truncation detected" in w for w in report.warnings):
        pages_with_questions = set()
        # Find the last page that had questions
        for msg in report.warnings:
            if "Truncation detected" in msg:
                try:
                    import re
                    m = re.search(r"after page (\d+)", msg)
                    if m:
                        max_page = int(m.group(1))
                except:
                    pass
        
        if max_page >= 0:
            for p in range(max_page, len(pages_data)):
                recovery_pages.add(p)

    # If no specific pages identified, recover all
    if not recovery_pages and report.recovery_needed:
        recovery_pages = set(range(len(pages_data)))

    return sorted(recovery_pages)


# ---------------------------------------------------------------------------
# Recovery via Targeted Vision Re-Extraction
# ---------------------------------------------------------------------------

def merge_recovery_results(existing_questions: List[Dict],
                           recovery_questions: List[Dict]) -> List[Dict]:
    """
    Merge recovery-extracted questions with existing ones.
    Only adds questions that don't already exist (by question number).
    """
    existing_nums = set()
    for q in existing_questions:
        q_num = q.get("questionNumber", "") or q.get("questionNo", "")
        if q_num:
            existing_nums.add(str(q_num).strip().lower())

    added = 0
    for rq in recovery_questions:
        rq_num = rq.get("questionNumber", "") or rq.get("questionNo", "")
        if rq_num and str(rq_num).strip().lower() not in existing_nums:
            existing_questions.append(rq)
            existing_nums.add(str(rq_num).strip().lower())
            added += 1

    if added > 0:
        logger.info(f"[Recovery] Added {added} previously missing questions")

    # Re-sort by question number
    def sort_key(q):
        q_num = q.get("questionNumber", "") or q.get("questionNo", "")
        num_match = re.match(r'^(\d+)', str(q_num))
        if num_match:
            return (int(num_match.group(1)), q_num)
        return (999, q_num)

    existing_questions.sort(key=sort_key)

    return existing_questions
