"""
Stage 3: Question Segmentation Engine

Combines text blocks (Stage 1) + layout info (Stage 2) to segment questions.
Uses rule-based + heuristic analysis — NOT purely LLM-dependent.

Key capabilities:
- Regex + font-weight + spacing question boundary detection
- OR block detection
- Fill-in-the-Blanks grouping
- MCQ option detection
- Case study / passage-based grouping
- Sub-question hierarchy
- Section/Part structure
- Table/image → question spatial linking
- Cross-page question stitching
- Marks extraction
"""

import re
import uuid
import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Pre-compiled patterns (compiled once at module load for speed)
# ---------------------------------------------------------------------------

# Main question number patterns — ordered by specificity
_Q_PATTERNS = [
    # "Q1.", "Q.1", "Q 1", "Q1)", "Q1:"
    re.compile(r'^Q\.?\s*(\d+[a-zA-Z]?)\s*[.):]\s*', re.IGNORECASE),
    # "Question 1", "Question 1.", "Question 1:"
    re.compile(r'^Question\s+(\d+[a-zA-Z]?)\s*[.):]*\s*', re.IGNORECASE),
    # "1.", "1)", "1:", "4A." at start of line (must have punctuation)
    re.compile(r'^(\d{1,3}[a-zA-Z]?)\s*[.):]+(?:\s+|$)'),
    # "(1)", "(2)" etc (Removed because it commonly matches list items inside sentences)
    # re.compile(r'^\((\d{1,3}[a-zA-Z]?)\)\s*'),
    # "4A ", "5B " (Number + Letter + Space, no punctuation needed)
    # re.compile(r'^(\d{1,3}[A-Z])\s+'),
    # "6 Read", "8 Answer" (Number + Space + Instruction word, no punctuation needed)
    re.compile(r'^(\d{1,3})\s+(?:Read|Answer|Attempt|Complete|Fill|Solve|Evaluate|Find|Calculate|State|Explain|Discuss|Write|Identify|What|How|Why)\b', re.IGNORECASE),
]

# Sub-question patterns
_SUB_Q_PATTERNS = [
    # "(a)", "(b)", "(c)"
    re.compile(r'^\(([a-z])\)\s*'),
    # "a)", "b)", "c)"
    re.compile(r'^([a-z])\)\s*'),
    # "(i)", "(ii)", "(iii)", "(iv)"
    re.compile(r'^\(([ivxIVX]+)\)\s*'),
    # "i)", "ii)", "iii)"
    re.compile(r'^([ivxIVX]+)\)\s*'),
    # "a.", "b.", "c." (only single lowercase letter followed by period and space)
    re.compile(r'^([a-z])\.\s*'),
    # "I ", "II ", "III " (Uppercase roman numerals followed by space)
    re.compile(r'^([IVX]+)\s+'),
]

# OR block patterns
_OR_PATTERNS = [
    re.compile(r'^\s*OR\s*$', re.IGNORECASE),
    re.compile(r'^\s*(?:OR|or)\s*$'),
    re.compile(r'^\s*\bOR\b\s*', re.IGNORECASE),
]

# Section/Part patterns
_SECTION_PATTERNS = [
    re.compile(r'^SECTION\s*[-–—:]?\s*([A-Z])\b', re.IGNORECASE),
    re.compile(r'^PART\s*[-–—:]?\s*([A-Z])\b', re.IGNORECASE),
    re.compile(r'^(?:SECTION|PART)\s+([A-Z])\s*[-–—:]\s*(.+)', re.IGNORECASE),
]

# Marks patterns
_MARKS_PATTERNS = [
    re.compile(r'\[(\d+)\s*(?:marks?|m)\]', re.IGNORECASE),
    re.compile(r'\((\d+)\s*(?:marks?|m)\)', re.IGNORECASE),
    re.compile(r'(\d+)\s*(?:marks?|m)\s*$', re.IGNORECASE),
    re.compile(r'(?:marks?)\s*[:\-]?\s*(\d+)', re.IGNORECASE),
]

# MCQ option patterns
_MCQ_OPTION_PATTERNS = [
    re.compile(r'^\s*\(?([a-dA-D])\)\s*(.+)'),
    re.compile(r'^\s*([a-dA-D])\.\s+(.+)'),
    re.compile(r'^\s*([a-dA-D])\)\s+(.+)'),
    re.compile(r'^\s*\(([1-4])\)\s*(.+)'),
]

# Fill in the blanks patterns
_FIB_PATTERNS = [
    re.compile(r'fill\s+in\s+the\s+blanks?', re.IGNORECASE),
    re.compile(r'fill\s+(?:up\s+)?the\s+(?:following\s+)?blanks?', re.IGNORECASE),
    re.compile(r'complete\s+the\s+(?:following\s+)?(?:sentences?|statements?)', re.IGNORECASE),
]

# Case study / passage patterns
_CASE_STUDY_PATTERNS = [
    re.compile(r'(?:read|study)\s+the\s+(?:following|given)\s+(?:passage|case|extract|text)', re.IGNORECASE),
    re.compile(r'case\s+study', re.IGNORECASE),
    re.compile(r'(?:read|study)\s+the\s+(?:following|given)', re.IGNORECASE),
    re.compile(r'based\s+on\s+the\s+(?:above|following|given)\s+(?:passage|case|extract|information)', re.IGNORECASE),
    re.compile(r'comprehension', re.IGNORECASE),
]

# Match the following pattern
_MATCH_PATTERNS = [
    re.compile(r'match\s+the\s+(?:following|columns?)', re.IGNORECASE),
    re.compile(r'match\s+(?:column|list)\s+[A-Z]\s+(?:with|to)\s+(?:column|list)\s+[A-Z]', re.IGNORECASE),
]

# Assertion-Reason pattern
_ASSERTION_REASON_PATTERNS = [
    re.compile(r'assertion\s*[\-–—:]\s*reason', re.IGNORECASE),
    re.compile(r'assertion\s*\(?A\)?\s*:', re.IGNORECASE),
    re.compile(r'(?:assertion|reason)\s*\(?[AR]\)?', re.IGNORECASE),
]

# Instruction patterns to skip
_INSTRUCTION_PATTERNS = [
    re.compile(r'(?:attempt|answer)\s+(?:any|all)\s+(?:\d+|five|four|three|two)', re.IGNORECASE),
    re.compile(r'(?:all|each)\s+questions?\s+(?:are|is)\s+(?:compulsory|mandatory)', re.IGNORECASE),
    re.compile(r'general\s+instructions?', re.IGNORECASE),
    re.compile(r'this\s+(?:paper|question\s+paper)\s+(?:contains?|consists?|has)', re.IGNORECASE),
    re.compile(r'internal\s+choice', re.IGNORECASE),
    re.compile(r'use\s+of\s+calculat', re.IGNORECASE),
    re.compile(r'write\s+your\s+(?:name|roll)', re.IGNORECASE),
    re.compile(r'time\s*(?:allowed|:)', re.IGNORECASE),
    re.compile(r'maximum\s+marks', re.IGNORECASE),
    re.compile(r'(?:note|instructions?)\s*:', re.IGNORECASE),
]

# Choose/attempt instruction embedded in section header
_SECTION_INSTRUCTION_PATTERN = re.compile(
    r'(?:choose|attempt|answer)\s+(?:any\s+)?(\d+|one|two|three|four|five)',
    re.IGNORECASE
)


# ---------------------------------------------------------------------------
# Question Type Detection
# ---------------------------------------------------------------------------

def _detect_question_type(text: str, has_options: bool = False, has_table: bool = False,
                          has_image: bool = False, has_graph: bool = False) -> str:
    """Detect the question type from its content."""
    text_lower = text.lower()

    # Check for specific patterns
    for p in _ASSERTION_REASON_PATTERNS:
        if p.search(text_lower):
            return "Assertion Reason"

    for p in _MATCH_PATTERNS:
        if p.search(text_lower):
            return "Match the Following"

    for p in _FIB_PATTERNS:
        if p.search(text_lower):
            return "Fill in the Blanks"

    for p in _CASE_STUDY_PATTERNS:
        if p.search(text_lower):
            return "Case Study"

    if has_options:
        return "MCQ"

    if has_graph or "graph" in text_lower or "plot" in text_lower:
        return "Graph Based"

    if has_table or "table" in text_lower:
        return "Table Based"

    if has_image:
        if any(kw in text_lower for kw in ["circuit", "diagram"]):
            return "Diagram Based"
        if any(kw in text_lower for kw in ["map", "atlas"]):
            return "Map Based"
        if any(kw in text_lower for kw in ["figure", "fig.", "image", "picture", "photograph"]):
            return "Image Based"
        return "Image Based"

    if any(kw in text_lower for kw in ["write a program", "code", "algorithm", "pseudo"]):
        return "Coding Question"

    if any(kw in text_lower for kw in ["derive", "prove", "show that"]):
        return "Long Answer"

    if any(kw in text_lower for kw in ["define", "what is", "name", "list", "state"]):
        return "Short Answer"

    if any(kw in text_lower for kw in ["explain", "describe", "discuss", "elaborate", "illustrate"]):
        return "Long Answer"

    if any(kw in text_lower for kw in ["calculate", "find", "compute", "solve", "evaluate"]):
        return "Numerical"

    return "Subjective"


# ---------------------------------------------------------------------------
# Marks Extraction
# ---------------------------------------------------------------------------

def _extract_marks(text: str) -> Optional[int]:
    """Extract marks value from question text."""
    for pattern in _MARKS_PATTERNS:
        match = pattern.search(text)
        if match:
            val = int(match.group(1))
            if 1 <= val <= 20:  # Reasonable range
                return val
    return None


# ---------------------------------------------------------------------------
# MCQ Options Extraction
# ---------------------------------------------------------------------------

def _extract_mcq_options(lines: List[str]) -> Tuple[List[Dict[str, str]], List[str]]:
    """
    Extract MCQ options from lines.
    Returns (options_list, remaining_lines_without_options).
    """
    options = []
    remaining = []
    in_options = False

    for line in lines:
        stripped = line.strip()
        matched = False
        for pattern in _MCQ_OPTION_PATTERNS:
            m = pattern.match(stripped)
            if m:
                options.append({
                    "label": m.group(1).upper(),
                    "text": m.group(2).strip()
                })
                matched = True
                in_options = True
                break

        if not matched:
            if in_options and stripped and not any(p.match(stripped) for p in _Q_PATTERNS):
                # Continuation of last option
                if options:
                    options[-1]["text"] += " " + stripped
                else:
                    remaining.append(line)
            else:
                in_options = False
                remaining.append(line)

    return options, remaining


# ---------------------------------------------------------------------------
# Section Detection
# ---------------------------------------------------------------------------

def _is_section_header(text: str, is_bold: bool = False, font_size: float = 0) -> Optional[Dict[str, str]]:
    """Check if text is a section/part header."""
    stripped = text.strip()
    for pattern in _SECTION_PATTERNS:
        m = pattern.match(stripped)
        if m:
            section_letter = m.group(1).upper()
            section_title = m.group(2).strip() if m.lastindex >= 2 else ""
            return {"section": section_letter, "title": section_title}
    return None


def _is_instruction(text: str) -> bool:
    """Check if text is a general instruction (not a question)."""
    stripped = text.strip()
    if len(stripped) < 5:
        return True  # Too short to be a question
    for pattern in _INSTRUCTION_PATTERNS:
        if pattern.search(stripped):
            return True
    return False


# ---------------------------------------------------------------------------
# Question Boundary Detection
# ---------------------------------------------------------------------------

@dataclass
class RawQuestionBlock:
    """Intermediate representation of a question before final assembly."""
    question_number: str = ""
    parent_number: str = ""
    text_lines: List[str] = field(default_factory=list)
    section: str = ""
    marks: Optional[int] = None
    is_or_alternative: bool = False
    or_group_id: str = ""
    page_num: int = 0
    y_start: float = 0.0
    y_end: float = 0.0
    font_size: float = 0.0
    is_bold: bool = False
    options: List[Dict[str, str]] = field(default_factory=list)
    linked_tables: List[Any] = field(default_factory=list)
    linked_images: List[Any] = field(default_factory=list)
    question_type: str = ""
    sub_questions: List['RawQuestionBlock'] = field(default_factory=list)


def _detect_question_start(text: str) -> Optional[Tuple[str, str]]:
    """
    Check if text starts with a question number.
    Returns (question_number, remaining_text) or None.
    """
    stripped = text.strip()
    for pattern in _Q_PATTERNS:
        m = pattern.match(stripped)
        if m:
            q_num = m.group(1)
            remaining = stripped[m.end():].strip()
            return (q_num, remaining)
    return None


def _detect_sub_question(text: str) -> Optional[Tuple[str, str]]:
    """
    Check if text starts with a sub-question label.
    Returns (sub_label, remaining_text) or None.
    """
    stripped = text.strip()
    for pattern in _SUB_Q_PATTERNS:
        m = pattern.match(stripped)
        if m:
            sub_label = m.group(1)
            remaining = stripped[m.end():].strip()
            return (sub_label, remaining)
    return None


def _is_or_block(text: str) -> bool:
    """Check if text is an OR separator."""
    stripped = text.strip()
    for pattern in _OR_PATTERNS:
        if pattern.match(stripped):
            return True
    return False


# ---------------------------------------------------------------------------
# Spatial Linking (Tables & Images → Questions)
# ---------------------------------------------------------------------------

def _link_visual_elements(questions: List[RawQuestionBlock],
                          tables: List[Any],
                          images: List[Any],
                          page_height: float) -> None:
    """
    Link tables and images to questions using spatial proximity.
    A visual element belongs to the question whose vertical extent
    overlaps or is closest above it.
    """
    for table in tables:
        table_y = getattr(table, 'y0', 0)
        table_page = getattr(table, 'page_num', 0)
        best_q = None
        best_dist = float('inf')

        for q in questions:
            if q.page_num != table_page:
                continue
            # Table is below question start and above next question
            dist = abs(table_y - q.y_start)
            if table_y >= q.y_start and dist < best_dist:
                best_dist = dist
                best_q = q

        if best_q is None:
            # Find closest question above
            for q in questions:
                if q.page_num != table_page:
                    continue
                if q.y_start <= table_y:
                    dist = table_y - q.y_start
                    if dist < best_dist:
                        best_dist = dist
                        best_q = q

        if best_q:
            confidence = 0.95 if best_dist < 50 else (0.8 if best_dist < 150 else 0.5)
            if not hasattr(table, 'metadata'):
                table.metadata = {}
            table.metadata["linking_confidence"] = confidence
            best_q.linked_tables.append(table)

    for image in images:
        img_y = getattr(image, 'y0', 0)
        img_page = getattr(image, 'page_num', 0)
        best_q = None
        best_dist = float('inf')

        for q in questions:
            if q.page_num != img_page:
                continue
            dist = abs(img_y - q.y_start)
            if img_y >= q.y_start and dist < best_dist:
                best_dist = dist
                best_q = q

        if best_q is None:
            for q in questions:
                if q.page_num != img_page:
                    continue
                if q.y_start <= img_y:
                    dist = img_y - q.y_start
                    if dist < best_dist:
                        best_dist = dist
                        best_q = q

        if best_q:
            confidence = 0.95 if best_dist < 50 else (0.8 if best_dist < 150 else 0.5)
            if not hasattr(image, 'metadata'):
                image.metadata = {}
            image.metadata["linking_confidence"] = confidence
            best_q.linked_images.append(image)


# ---------------------------------------------------------------------------
# Fill-in-the-Blanks Grouping
# ---------------------------------------------------------------------------

def _group_fill_in_the_blanks(questions: List[RawQuestionBlock]) -> List[RawQuestionBlock]:
    """
    If a question says 'Fill in the blanks' followed by numbered items,
    group them under one question instead of splitting into separate questions.
    """
    result = []
    i = 0
    while i < len(questions):
        q = questions[i]
        full_text = "\n".join(q.text_lines)

        # Check if this is a FIB header
        is_fib = any(p.search(full_text) for p in _FIB_PATTERNS)

        if is_fib:
            # Collect subsequent sub-items (roman numerals, letters) only — NOT new main questions
            fib_items = []
            j = i + 1
            while j < len(questions):
                next_q = questions[j]
                next_text = "\n".join(next_q.text_lines).strip()
                next_num = next_q.question_number or ""
                # Only absorb if it looks like a sub-item (roman numeral, letter, or
                # continuation) and NOT a new main question number
                is_main_q = next_num.isdigit() and int(next_num) != int(q.question_number or 0)
                is_sub_item = bool(re.match(r'^[ivx]+$', next_num, re.IGNORECASE)) or \
                              bool(re.match(r'^[a-z]$', next_num, re.IGNORECASE)) or \
                              next_q.parent_number
                if is_sub_item and not is_main_q and len(next_text) < 200:
                    fib_items.append(next_q)
                    j += 1
                else:
                    break

            if fib_items:
                for item in fib_items:
                    q.sub_questions.append(item)
                q.question_type = "Fill in the Blanks"
                result.append(q)
                i = j
                continue

        result.append(q)
        i += 1

    return result


# ---------------------------------------------------------------------------
# Cross-Page Stitching
# ---------------------------------------------------------------------------

def _stitch_cross_page_questions(all_page_questions: List[List[RawQuestionBlock]]) -> List[RawQuestionBlock]:
    """
    Handle questions that span page boundaries.
    If the last item on page N has no question number and the first item
    on page N+1 also has no question number, they may be continuations.
    """
    merged = []
    pending_continuation = None

    for page_idx, page_questions in enumerate(all_page_questions):
        for q_idx, q in enumerate(page_questions):
            if pending_continuation and q_idx == 0 and not q.question_number:
                # This is a continuation of the previous page's last question
                pending_continuation.text_lines.extend(q.text_lines)
                pending_continuation.linked_tables.extend(q.linked_tables)
                pending_continuation.linked_images.extend(q.linked_images)
                pending_continuation = None
                continue

            if pending_continuation:
                merged.append(pending_continuation)
                pending_continuation = None

            merged.append(q)

        # Check if last question on this page might continue
        if page_questions and page_idx < len(all_page_questions) - 1:
            last_q = page_questions[-1]
            last_text = "\n".join(last_q.text_lines).strip()
            # If it ends mid-sentence (no period, no question mark)
            if last_text and not last_text[-1] in '.?!:':
                pending_continuation = merged.pop() if merged and merged[-1] is last_q else None

    if pending_continuation:
        merged.append(pending_continuation)

    return merged


# ---------------------------------------------------------------------------
# Main Segmentation Functions
# ---------------------------------------------------------------------------

def segment_questions_from_text(text_blocks: List, page_num: int,
                                section_context: str = "") -> List[RawQuestionBlock]:
    """
    Segment questions from text blocks on a single page.
    Uses question number detection, font analysis, and spacing.
    """
    questions = []
    current_question = None
    current_section = section_context
    or_group_counter = 0
    _pending_or = False  # True when next question should be marked as OR alternative

    for block in text_blocks:
        text = block.text.strip()
        if not text:
            continue

        # Check for section header
        section_info = _is_section_header(text, block.is_bold, block.font_size)
        if section_info:
            current_section = f"Section {section_info['section']}"
            if section_info.get('title'):
                current_section += f": {section_info['title']}"
            continue

        # Skip general instructions
        if _is_instruction(text):
            continue

        # Check for OR block
        if _is_or_block(text):
            or_group_counter += 1
            if current_question:
                # Set the or_group_id on the CURRENT question
                current_question.or_group_id = f"or_{page_num}_{or_group_counter}"
            # Set flag so the NEXT question detected will be marked as OR alternative
            _pending_or = True
            continue

        # Process each line in the block
        lines = text.split("\n")
        for line in lines:
            line_stripped = line.strip()
            if not line_stripped:
                continue

            # Check for OR in a line
            if _is_or_block(line_stripped):
                or_group_counter += 1
                if current_question:
                    current_question.or_group_id = f"or_{page_num}_{or_group_counter}"
                _pending_or = True
                continue

            # Check for question start
            q_start = _detect_question_start(line_stripped)
            if q_start:
                q_num, remaining = q_start

                # Save previous question
                if current_question:
                    questions.append(current_question)

                current_question = RawQuestionBlock(
                    question_number=q_num,
                    section=current_section,
                    page_num=page_num,
                    y_start=block.y0,
                    font_size=block.font_size,
                    is_bold=block.is_bold,
                )
                # If we just saw an OR separator, mark this question as the alternative
                if _pending_or:
                    prev_q = questions[-1] if questions else None
                    if prev_q and prev_q.or_group_id:
                        current_question.is_or_alternative = True
                        current_question.or_group_id = prev_q.or_group_id
                    _pending_or = False

                if remaining:
                    current_question.text_lines.append(remaining)

                # Extract marks
                marks = _extract_marks(line_stripped)
                if marks:
                    current_question.marks = marks

                continue

            # Check for MCQ option BEFORE sub-question
            # (a) Central Processing Unit is an option, not sub-question 'a'
            # Heuristic: only treat as MCQ option if current question text suggests MCQ
            mcq_matched = False
            if current_question:
                current_text = "\n".join(current_question.text_lines).lower()
                is_mcq_context = any(kw in current_text for kw in [
                    "choose", "correct option", "correct answer", "select",
                    "tick", "mark the", "which of the following", "which one",
                    "the correct", "right answer",
                ])
                # Also MCQ if we already have options on this question
                if is_mcq_context or current_question.options:
                    for pattern in _MCQ_OPTION_PATTERNS:
                        m = pattern.match(line_stripped)
                        if m:
                            current_question.options.append({
                                "label": m.group(1).upper(),
                                "text": m.group(2).strip()
                            })
                            mcq_matched = True
                            break
            if mcq_matched:
                continue

            # Check for sub-question
            sub_start = _detect_sub_question(line_stripped)
            if sub_start and current_question:
                sub_label, remaining = sub_start
                sub_q = RawQuestionBlock(
                    question_number=f"{current_question.question_number}{sub_label}",
                    parent_number=current_question.question_number,
                    section=current_section,
                    page_num=page_num,
                    y_start=block.y0,
                )
                if remaining:
                    sub_q.text_lines.append(remaining)
                marks = _extract_marks(line_stripped)
                if marks:
                    sub_q.marks = marks
                current_question.sub_questions.append(sub_q)
                continue

            # Continuation of current question
            if current_question:
                current_question.text_lines.append(line_stripped)
                # Update marks if found in continuation
                if current_question.marks is None:
                    marks = _extract_marks(line_stripped)
                    if marks:
                        current_question.marks = marks

    # Don't forget the last question
    if current_question:
        questions.append(current_question)

    return questions


def segment_from_vision_data(vision_questions: List[Dict[str, Any]],
                             page_num: int) -> List[RawQuestionBlock]:
    """
    Convert Vision-extracted questions (from Stage 2 fallback) into RawQuestionBlocks.
    Used when PyMuPDF has no text layer (scanned documents).
    """
    blocks = []
    for vq in vision_questions:
        q_text = vq.get("questionText", "") or vq.get("text", "") or ""
        if not q_text or len(q_text.strip()) < 5:
            continue

        q_num = vq.get("questionNo", "") or vq.get("questionNumber", "") or ""

        block = RawQuestionBlock(
            question_number=str(q_num).replace("Q", "").strip(),
            page_num=page_num,
            text_lines=[q_text],
        )

        marks = vq.get("marks")
        if marks and isinstance(marks, (int, float)):
            block.marks = int(marks)

        # Handle options
        options = vq.get("options", [])
        if isinstance(options, list) and options:
            block.options = options

        # Handle images from vision
        images = vq.get("images", [])
        if isinstance(images, list):
            block.linked_images = images

        blocks.append(block)

    return blocks


# ---------------------------------------------------------------------------
# Final Assembly
# ---------------------------------------------------------------------------

def assemble_questions(raw_blocks: List[RawQuestionBlock],
                       doc_metadata: Any = None) -> List[Dict[str, Any]]:
    """
    Convert RawQuestionBlocks into the final question format
    that matches the existing API contract.

    Output schema matches what process_page_with_vision() currently returns
    (preserving backward compatibility).
    """
    questions = []

    for block in raw_blocks:
        q_text = "\n".join(block.text_lines).strip()
        if not q_text:
            continue

        # Detect MCQ options within the text
        text_lines = block.text_lines
        options, cleaned_lines = _extract_mcq_options(text_lines)
        if options:
            block.options = options
            q_text = "\n".join(cleaned_lines).strip()

        # Detect question type
        has_options = len(block.options) > 0
        has_table = len(block.linked_tables) > 0
        has_image = len(block.linked_images) > 0
        q_type = block.question_type or _detect_question_type(
            q_text, has_options, has_table, has_image
        )

        # Build question number string
        q_num = block.question_number or ""
        if block.parent_number:
            q_num = f"{block.parent_number}({q_num})" if q_num else block.parent_number

        # Append table markdown to question text and build tables list
        tables_out = []
        for table in block.linked_tables:
            md = getattr(table, 'markdown', '')
            if md:
                q_text += f"\n\n{md}"
            tables_out.append({
                "markdown": md,
                "metadata": getattr(table, 'metadata', {})
            })

        # Build images list
        images_out = []
        for img in block.linked_images:
            if isinstance(img, dict):
                # Already a dict from vision extraction
                images_out.append(img)
            else:
                # ImageData dataclass from Stage 1
                img_dict = {
                    "type": getattr(img, 'image_type', 'figure') or "figure",
                    "description": getattr(img, 'description', '') or getattr(img, 'caption', '') or "",
                }
                metadata = getattr(img, 'metadata', {})
                if metadata:
                    img_dict["metadata"] = metadata
                    
                url = getattr(img, 'saved_url', '') or getattr(img, 'url', '')
                if url:
                    img_dict["url"] = url
                images_out.append(img_dict)

        # Build the question dict (matching existing contract)
        question = {
            "questionNo": q_num,
            "questionNumber": q_num,
            "questionText": q_text,
            "marks": block.marks,
            "topic": "",  # Filled by fingerprinting stage
            "latex": "",  # Filled by fingerprinting stage
            "images": images_out,
            "tables": tables_out,
            "questionType": q_type,
            "section": block.section,
            "isOrAlternative": block.is_or_alternative,
            "orGroupId": block.or_group_id if block.or_group_id else None,
            "confidence": 0.9 if block.question_number else 0.7,
        }

        # Add options for MCQs
        if block.options:
            question["options"] = block.options

        questions.append(question)

        # Process sub-questions
        for sub in block.sub_questions:
            sub_text = "\n".join(sub.text_lines).strip()
            if not sub_text:
                continue

            sub_options, sub_cleaned = _extract_mcq_options(sub.text_lines)
            if sub_options:
                sub_text = "\n".join(sub_cleaned).strip()

            sub_type = _detect_question_type(sub_text, bool(sub_options))

            sub_q = {
                "questionNo": sub.question_number,
                "questionNumber": sub.question_number,
                "questionText": sub_text,
                "marks": sub.marks,
                "topic": "",
                "latex": "",
                "images": [],
                "questionType": sub_type,
                "section": block.section,
                "parentQuestion": block.question_number,
                "isOrAlternative": sub.is_or_alternative,
                "orGroupId": sub.or_group_id if sub.or_group_id else None,
                "confidence": 0.85,
            }
            if sub_options:
                sub_q["options"] = sub_options

            questions.append(sub_q)

    return questions


# ---------------------------------------------------------------------------
# Master Segmentation Function
# ---------------------------------------------------------------------------

def segment_document(pages_data: List, all_tables: List = None,
                     all_images: List = None,
                     vision_fallback_pages: Dict[int, List[Dict]] = None,
                     doc_metadata: Any = None) -> List[Dict[str, Any]]:
    """
    Master segmentation function.

    Args:
        pages_data: List of PageData from Stage 1
        all_tables: All tables extracted across pages
        all_images: All images extracted across pages
        vision_fallback_pages: Dict of page_num -> vision questions (for scanned pages)
        doc_metadata: DocumentMetadata from Stage 1

    Returns:
        List of question dicts matching existing API contract.
    """
    if vision_fallback_pages is None:
        vision_fallback_pages = {}

    all_page_questions = []
    current_section = ""

    for page in pages_data:
        page_num = page.page_num if hasattr(page, 'page_num') else 0

        if hasattr(page, 'has_text_layer') and page.has_text_layer:
            # Use PyMuPDF text blocks (deterministic, fast)
            text_blocks = page.text_blocks if hasattr(page, 'text_blocks') else []
            page_questions = segment_questions_from_text(
                text_blocks, page_num, current_section
            )
        elif page_num in vision_fallback_pages:
            # Use Vision-extracted questions for scanned pages
            page_questions = segment_from_vision_data(
                vision_fallback_pages[page_num], page_num
            )
        else:
            page_questions = []

        # Track section across pages
        if page_questions:
            last_section = page_questions[-1].section
            if last_section:
                current_section = last_section

        # Link visual elements to questions on this page
        page_tables = [t for t in (page.tables if hasattr(page, 'tables') else [])
                       if getattr(t, 'page_num', -1) == page_num]
        page_images = [im for im in (page.images if hasattr(page, 'images') else [])
                       if getattr(im, 'page_num', -1) == page_num]

        page_height = page.height if hasattr(page, 'height') else 1000
        _link_visual_elements(page_questions, page_tables, page_images, page_height)

        all_page_questions.append(page_questions)

    # Cross-page stitching
    merged_questions = _stitch_cross_page_questions(all_page_questions)

    # Fill-in-the-blanks grouping
    merged_questions = _group_fill_in_the_blanks(merged_questions)

    # Assemble final output
    final_questions = assemble_questions(merged_questions, doc_metadata)

    return final_questions
