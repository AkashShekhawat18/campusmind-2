"""
Stage 1: Document Understanding & Text Extraction

Extracts text, layout, tables, and images from PDF/image documents
using PyMuPDF's structured API (deterministic, no AI hallucination).

This runs in parallel with Stage 2 (Vision Layout Analysis) for maximum speed.
"""

import fitz  # PyMuPDF
import io
import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field, asdict
from PIL import Image

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Common English words for garbled text detection (lightweight dictionary)
# ---------------------------------------------------------------------------
# Top ~200 most frequent English words — enough to distinguish real text from
# garbled CMap output without needing a full dictionary or nltk.
_COMMON_ENGLISH_WORDS = frozenset({
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it",
    "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but",
    "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will",
    "my", "one", "all", "would", "there", "their", "what", "so", "up", "out",
    "if", "about", "who", "get", "which", "go", "me", "when", "make", "can",
    "like", "time", "no", "just", "him", "know", "take", "people", "into",
    "year", "your", "good", "some", "could", "them", "see", "other", "than",
    "then", "now", "look", "only", "come", "its", "over", "think", "also",
    "back", "after", "use", "two", "how", "our", "work", "first", "well",
    "way", "even", "new", "want", "because", "any", "these", "give", "day",
    "most", "us", "is", "are", "was", "were", "been", "has", "had", "did",
    "does", "may", "should", "each", "where", "much", "many", "more", "very",
    "find", "here", "thing", "those", "such", "own", "being", "both", "same",
    "number", "part", "long", "made", "between", "must", "before", "while",
    "still", "through", "let", "given", "show", "every", "under", "set",
    "question", "answer", "following", "write", "solve", "find", "calculate",
    "state", "explain", "define", "describe", "total", "marks", "section",
    "value", "function", "equation", "determine", "using", "method", "prove",
    "figure", "table", "graph", "data", "result", "example", "class",
    "consider", "system", "process", "following", "given", "true", "false",
})


def _is_text_garbled(raw_text: str) -> bool:
    """
    Detect garbled/unusable text from PyMuPDF extraction.
    
    Returns True if the text appears garbled due to broken CMap/ToUnicode
    tables in the PDF. Uses three independent heuristics:
    
    1. Space ratio: Garbled text has very few spaces (words run together).
    2. Word length: Garbled text produces abnormally long "words".
    3. Dictionary check: Garbled text contains very few recognizable English words.
    
    Any single failing heuristic triggers garbled detection.
    """
    if not raw_text or len(raw_text) < 100:
        return False  # Too short to judge
    
    # --- Heuristic 1: Space ratio ---
    space_ratio = raw_text.count(' ') / len(raw_text)
    if space_ratio < 0.08:  # Less than 8% spaces (raised from 5%)
        logger.info(f"Garbled detection: space ratio {space_ratio:.2%} < 8%")
        return True
    
    # --- Heuristic 2: Average word length ---
    words = raw_text.split()
    if not words:
        return False
    
    avg_word_len = sum(len(w) for w in words) / len(words)
    long_words = sum(1 for w in words if len(w) > 20)
    long_word_ratio = long_words / len(words)
    
    if avg_word_len > 15:
        logger.info(f"Garbled detection: avg word length {avg_word_len:.1f} > 15")
        return True
    if long_word_ratio > 0.30:  # More than 30% of words are > 20 chars
        logger.info(f"Garbled detection: {long_word_ratio:.0%} words are >20 chars")
        return True
    
    # --- Heuristic 3: Dictionary check ---
    # Only check alphabetic words of length >= 2
    alpha_words = [w.lower().strip('.,;:!?\'"()[]{}') for w in words 
                   if len(w) >= 2 and any(c.isalpha() for c in w)]
    
    if len(alpha_words) >= 10:  # Need enough words to be meaningful
        recognized = sum(1 for w in alpha_words if w in _COMMON_ENGLISH_WORDS)
        recognition_ratio = recognized / len(alpha_words)
        if recognition_ratio < 0.10:  # Less than 10% recognized words
            logger.info(f"Garbled detection: only {recognition_ratio:.0%} words recognized "
                        f"({recognized}/{len(alpha_words)})")
            return True
    
    return False


# ---------------------------------------------------------------------------
# Data classes for structured output
# ---------------------------------------------------------------------------

@dataclass
class TextBlock:
    """A block of text with layout metadata."""
    text: str
    x0: float
    y0: float
    x1: float
    y1: float
    font_size: float = 0.0
    font_name: str = ""
    is_bold: bool = False
    is_italic: bool = False
    page_num: int = 0
    block_idx: int = 0
    color: int = 0


@dataclass
class TableData:
    """A table extracted from the document."""
    rows: List[List[str]] = field(default_factory=list)
    headers: List[str] = field(default_factory=list)
    x0: float = 0.0
    y0: float = 0.0
    x1: float = 0.0
    y1: float = 0.0
    page_num: int = 0
    markdown: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ImageData:
    """An image extracted from the document."""
    image_bytes: bytes = b""
    x0: float = 0.0
    y0: float = 0.0
    x1: float = 0.0
    y1: float = 0.0
    page_num: int = 0
    width: int = 0
    height: int = 0
    xref: int = 0
    caption: str = ""
    description: str = ""
    image_type: str = ""
    saved_url: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PageData:
    """Complete extracted data for a single page."""
    page_num: int
    width: float
    height: float
    text_blocks: List[TextBlock] = field(default_factory=list)
    tables: List[TableData] = field(default_factory=list)
    images: List[ImageData] = field(default_factory=list)
    raw_text: str = ""
    has_text_layer: bool = False
    is_multi_column: bool = False
    page_image_bytes: bytes = b""  # Rendered page image for Vision


@dataclass
class DocumentMetadata:
    """Document-level metadata detected from content."""
    subject: str = ""
    board: str = ""
    exam_type: str = ""
    year: Optional[int] = None
    month: str = ""
    class_level: str = ""
    semester: Optional[int] = None
    branch: str = ""
    duration: str = ""
    total_marks: Optional[int] = None
    language: str = "English"
    paper_type: str = ""  # e.g., "CBSE Board Exam", "University End Semester"


@dataclass
class DocumentUnderstanding:
    """Complete document understanding output."""
    pages: List[PageData] = field(default_factory=list)
    metadata: DocumentMetadata = field(default_factory=DocumentMetadata)
    total_pages: int = 0
    has_text_layer: bool = False


# ---------------------------------------------------------------------------
# PyMuPDF Text Extraction with Layout
# ---------------------------------------------------------------------------

def _extract_text_blocks(page: fitz.Page, page_num: int) -> List[TextBlock]:
    """
    Extract text blocks with full layout metadata using PyMuPDF's dict output.
    This gives us font size, font name, bold/italic, position, and color —
    critical for segmentation.
    """
    blocks = []
    try:
        page_dict = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)
        block_idx = 0

        for block in page_dict.get("blocks", []):
            if block.get("type") != 0:  # type 0 = text block
                continue

            block_text_parts = []
            max_font_size = 0.0
            primary_font = ""
            is_bold = False
            is_italic = False
            primary_color = 0

            for line in block.get("lines", []):
                line_text = ""
                prev_x1 = -1
                for span in line.get("spans", []):
                    span_text = span.get("text", "")
                    if not span_text:
                        continue
                        
                    font_size = span.get("size", 10)
                    bbox = span.get("bbox", (0, 0, 0, 0))
                    span_x0 = bbox[0]
                    
                    # Insert space if there is a significant horizontal gap
                    if prev_x1 >= 0 and (span_x0 - prev_x1) > (0.15 * font_size):
                        if not line_text.endswith(" ") and not span_text.startswith(" "):
                            line_text += " "
                            
                    line_text += span_text
                    prev_x1 = bbox[2]
                    
                    if font_size > max_font_size:
                        max_font_size = font_size
                        primary_font = span.get("font", "")
                        primary_color = span.get("color", 0)
                    # Detect bold/italic from font name flags
                    flags = span.get("flags", 0)
                    if flags & 2 ** 4:  # bit 4 = bold
                        is_bold = True
                    if flags & 2 ** 1:  # bit 1 = italic
                        is_italic = True
                    font_name = span.get("font", "").lower()
                    if "bold" in font_name or "heavy" in font_name:
                        is_bold = True
                    if "italic" in font_name or "oblique" in font_name:
                        is_italic = True

                if line_text.strip():
                    block_text_parts.append(line_text)

            full_text = "\n".join(block_text_parts).strip()
            if not full_text:
                continue

            bbox = block.get("bbox", (0, 0, 0, 0))
            blocks.append(TextBlock(
                text=full_text,
                x0=bbox[0],
                y0=bbox[1],
                x1=bbox[2],
                y1=bbox[3],
                font_size=max_font_size,
                font_name=primary_font,
                is_bold=is_bold,
                is_italic=is_italic,
                page_num=page_num,
                block_idx=block_idx,
                color=primary_color
            ))
            block_idx += 1

    except Exception as e:
        logger.warning(f"Text block extraction error on page {page_num}: {e}")

    return blocks


def _detect_multi_column(text_blocks: List[TextBlock], page_width: float) -> bool:
    """
    Detect multi-column layout by analyzing x-coordinates of text blocks.
    If there are two distinct clusters of x0 values, it's multi-column.
    """
    if len(text_blocks) < 4:
        return False

    x_positions = sorted(set(round(b.x0, -1) for b in text_blocks))
    if len(x_positions) < 2:
        return False

    # Check if there's a significant gap in the middle of the page
    mid = page_width / 2
    left_blocks = [b for b in text_blocks if b.x0 < mid - 30]
    right_blocks = [b for b in text_blocks if b.x0 > mid + 30]

    if len(left_blocks) >= 3 and len(right_blocks) >= 3:
        return True

    return False


# ---------------------------------------------------------------------------
# Table Extraction
# ---------------------------------------------------------------------------

def _extract_tables_pymupdf(page: fitz.Page, page_num: int) -> List[TableData]:
    """
    Extract tables using PyMuPDF's built-in table finder.
    Fast and reliable for well-structured tables.
    """
    tables = []
    try:
        tab_finder = page.find_tables()
        for tab in tab_finder.tables:
            rows = []
            for row in tab.extract():
                cleaned_row = [cell if cell else "" for cell in row]
                rows.append(cleaned_row)

            if not rows:
                continue

            headers = rows[0] if rows else []
            bbox = tab.bbox

            # Build markdown representation
            md = _table_to_markdown(rows)

            tables.append(TableData(
                rows=rows,
                headers=headers,
                x0=bbox[0],
                y0=bbox[1],
                x1=bbox[2],
                y1=bbox[3],
                page_num=page_num,
                markdown=md
            ))
    except Exception as e:
        logger.debug(f"PyMuPDF table extraction on page {page_num}: {e}")

    return tables


def _extract_tables_pdfplumber(file_bytes: bytes, page_num: int) -> List[TableData]:
    """
    Fallback table extraction using pdfplumber.
    Better at detecting borderless tables.
    """
    tables = []
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            if page_num < len(pdf.pages):
                plumber_page = pdf.pages[page_num]
                # Advanced table settings for complex borders
                table_settings = {
                    "vertical_strategy": "lines",
                    "horizontal_strategy": "lines",
                    "intersection_y_tolerance": 5,
                    "intersection_x_tolerance": 5
                }
                for tab in plumber_page.extract_tables(table_settings):
                    if not tab:
                        continue
                    rows = []
                    for row in tab:
                        # Replace newlines with spaces to preserve markdown table structure
                        cleaned = [str(cell).replace('\n', ' ').strip() if cell else "" for cell in row]
                        rows.append(cleaned)
                    if rows:
                        md = _table_to_markdown(rows)
                        tables.append(TableData(
                            rows=rows,
                            headers=rows[0] if rows else [],
                            page_num=page_num,
                            markdown=md
                        ))
    except Exception as e:
        logger.debug(f"pdfplumber table extraction on page {page_num}: {e}")

    return tables


def _table_to_markdown(rows: List[List[str]]) -> str:
    """Convert table rows to markdown format."""
    if not rows:
        return ""

    lines = []
    # Header row
    header = rows[0]
    lines.append("| " + " | ".join(str(c).strip() for c in header) + " |")
    lines.append("| " + " | ".join("---" for _ in header) + " |")

    # Data rows
    for row in rows[1:]:
        # Pad row to match header length
        padded = list(row) + [""] * max(0, len(header) - len(row))
        lines.append("| " + " | ".join(str(c).strip() for c in padded[:len(header)]) + " |")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Image Extraction
# ---------------------------------------------------------------------------

def _extract_images(page: fitz.Page, page_num: int) -> List[ImageData]:
    """
    Extract embedded images from the PDF page.
    Returns image bytes + bounding box metadata.
    """
    images = []
    try:
        image_list = page.get_images(full=True)
        for img_idx, img_info in enumerate(image_list):
            xref = img_info[0]
            try:
                base_image = page.parent.extract_image(xref)
                if not base_image or not base_image.get("image"):
                    continue

                img_bytes = base_image["image"]
                img_ext = base_image.get("ext", "png")
                width = base_image.get("width", 0)
                height = base_image.get("height", 0)

                # Get image position on page
                rects = page.get_image_rects(xref)
                if rects:
                    rect = rects[0]
                    images.append(ImageData(
                        image_bytes=img_bytes,
                        x0=rect.x0,
                        y0=rect.y0,
                        x1=rect.x1,
                        y1=rect.y1,
                        page_num=page_num,
                        width=width,
                        height=height,
                        xref=xref,
                        image_type=img_ext
                    ))
            except Exception as img_err:
                logger.debug(f"Image extraction error xref={xref}: {img_err}")
                continue

    except Exception as e:
        logger.debug(f"Image listing error on page {page_num}: {e}")

    return images


# ---------------------------------------------------------------------------
# Document Metadata Detection
# ---------------------------------------------------------------------------

# Pre-compiled patterns for speed
_YEAR_PATTERN = re.compile(r'\b(20[0-2]\d|19[89]\d)\b')
_MARKS_PATTERN = re.compile(
    r'(?:maximum|max|total|full)\s*(?:marks?)\s*[:\-]?\s*(\d+)|'
    r'(?:marks?)\s*[:\-]?\s*(\d+)|'
    r'(\d+)\s*(?:marks?)',
    re.IGNORECASE
)
_DURATION_PATTERN = re.compile(
    r'(?:time|duration|allowed)\s*[:\-]?\s*(\d+\.?\d*)\s*(?:hours?|hrs?|minutes?|mins?)',
    re.IGNORECASE
)
_SEMESTER_PATTERN = re.compile(
    r'(?:semester|sem)\s*[:\-]?\s*(\d+|[IVX]+)',
    re.IGNORECASE
)

_BOARD_KEYWORDS = {
    "cbse": "CBSE", "icse": "ICSE", "isc": "ISC",
    "cisce": "CISCE", "state board": "State Board",
    "jee": "JEE", "neet": "NEET", "gate": "GATE",
    "upsc": "UPSC", "cat": "CAT",
}

_EXAM_TYPE_KEYWORDS = {
    "end semester": "End Semester", "end-semester": "End Semester",
    "endsem": "End Semester", "end sem": "End Semester",
    "mid semester": "Mid Semester", "mid-semester": "Mid Semester",
    "midsem": "Mid Semester", "mid sem": "Mid Semester",
    "annual": "Annual", "board exam": "Board Exam",
    "unit test": "Unit Test", "prelim": "Preliminary",
    "practice": "Practice", "sample": "Sample Paper",
    "model paper": "Model Paper", "previous year": "Previous Year",
    "term 1": "Term 1", "term 2": "Term 2",
    "term-1": "Term 1", "term-2": "Term 2",
    "practical": "Practical",
}


def _detect_metadata(pages: List[PageData]) -> DocumentMetadata:
    """
    Detect document-level metadata from the first 1-2 pages.
    Uses keyword matching — fast, no AI call needed.
    """
    meta = DocumentMetadata()

    # Analyze first 2 pages (headers/title pages)
    header_text = ""
    for page in pages[:2]:
        # Use larger-font blocks (likely headers/titles)
        sorted_blocks = sorted(page.text_blocks, key=lambda b: b.font_size, reverse=True)
        for block in sorted_blocks[:10]:
            header_text += block.text + "\n"

    if not header_text:
        return meta

    header_lower = header_text.lower()

    # Board detection
    for keyword, board_name in _BOARD_KEYWORDS.items():
        if keyword in header_lower:
            meta.board = board_name
            break

    # Exam type detection
    for keyword, exam_type in _EXAM_TYPE_KEYWORDS.items():
        if keyword in header_lower:
            meta.exam_type = exam_type
            break

    # Year detection
    year_match = _YEAR_PATTERN.search(header_text)
    if year_match:
        meta.year = int(year_match.group())

    # Total marks
    marks_match = _MARKS_PATTERN.search(header_text)
    if marks_match:
        for g in marks_match.groups():
            if g:
                val = int(g)
                if 10 <= val <= 500:  # Reasonable range for total marks
                    meta.total_marks = val
                    break

    # Duration
    dur_match = _DURATION_PATTERN.search(header_text)
    if dur_match:
        meta.duration = dur_match.group().strip()

    # Semester
    sem_match = _SEMESTER_PATTERN.search(header_text)
    if sem_match:
        sem_val = sem_match.group(1)
        roman_map = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8}
        if sem_val.upper() in roman_map:
            meta.semester = roman_map[sem_val.upper()]
        elif sem_val.isdigit():
            meta.semester = int(sem_val)

    return meta


# ---------------------------------------------------------------------------
# Main Entry Point
# ---------------------------------------------------------------------------

def analyze_document(file_bytes: bytes, filename: str, mime_type: str) -> DocumentUnderstanding:
    """
    Stage 1: Complete document understanding.

    For PDFs:
    - Extract text with layout (font, position, bold/italic)
    - Extract tables (PyMuPDF + pdfplumber fallback)
    - Extract embedded images with positions
    - Render page images for Vision (Stage 2)
    - Detect document metadata

    For images:
    - Create a single PageData with the image
    - No text extraction (deferred to Vision in Stage 2)

    This function is CPU-bound and fast — no API calls.
    """
    result = DocumentUnderstanding()

    if mime_type == "application/pdf" or filename.lower().endswith(".pdf"):
        pdf_doc = fitz.open(stream=file_bytes, filetype="pdf")
        result.total_pages = len(pdf_doc)

        for page_num in range(len(pdf_doc)):
            page = pdf_doc.load_page(page_num)
            page_rect = page.rect

            # Extract text with layout
            text_blocks = _extract_text_blocks(page, page_num)

            # Raw text for quick searches
            raw_text = page.get_text("text").strip()
            has_text = len(raw_text) > 50  # Meaningful text content
            
            # Quality check: detect garbled text (missing spaces, broken CMap, etc.)
            # Uses multi-heuristic detection: space ratio, word length, dictionary check.
            if has_text and _is_text_garbled(raw_text):
                logger.warning(f"Page {page_num}: Text layer is garbled, "
                               f"marking as no-text for Vision fallback")
                has_text = False

            # Multi-column detection
            is_multi_col = _detect_multi_column(text_blocks, page_rect.width)

            # Table extraction (PyMuPDF primary)
            tables = _extract_tables_pymupdf(page, page_num)

            # pdfplumber fallback for tables only if PyMuPDF found none
            if not tables:
                tables = _extract_tables_pdfplumber(file_bytes, page_num)

            # Image extraction
            images = _extract_images(page, page_num)

            # Render page as image for Vision Stage 2
            # Use 150 DPI for good quality without being too large
            pix = page.get_pixmap(dpi=150)
            page_image_bytes = pix.tobytes("png")

            page_data = PageData(
                page_num=page_num,
                width=page_rect.width,
                height=page_rect.height,
                text_blocks=text_blocks,
                tables=tables,
                images=images,
                raw_text=raw_text,
                has_text_layer=has_text,
                is_multi_column=is_multi_col,
                page_image_bytes=page_image_bytes,
            )
            result.pages.append(page_data)

        pdf_doc.close()
        result.has_text_layer = any(p.has_text_layer for p in result.pages)

    elif mime_type.startswith("image/"):
        # Single image — no text extraction possible without Vision
        result.total_pages = 1
        result.has_text_layer = False

        page_data = PageData(
            page_num=0,
            width=0,
            height=0,
            has_text_layer=False,
            page_image_bytes=file_bytes,
        )

        # Try to get dimensions
        try:
            img = Image.open(io.BytesIO(file_bytes))
            page_data.width = img.width
            page_data.height = img.height
        except Exception:
            pass

        result.pages.append(page_data)

    # Detect metadata from extracted text
    result.metadata = _detect_metadata(result.pages)

    return result
