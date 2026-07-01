import cv2
import numpy as np

def deskew_image(image: np.ndarray) -> np.ndarray:
    """Deskew the image using contour bounding boxes."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.bitwise_not(gray)
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
    
    coords = np.column_stack(np.where(thresh > 0))
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
        
    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    return rotated

def denoise_image(image: np.ndarray) -> np.ndarray:
    """Apply non-local means denoising."""
    return cv2.fastNlMeansDenoisingColored(image, None, 10, 10, 7, 21)

def enhance_contrast(image: np.ndarray) -> np.ndarray:
    """Enhance contrast using CLAHE."""
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    limg = cv2.merge((cl, a, b))
    return cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)

def adaptive_threshold(image: np.ndarray) -> np.ndarray:
    """Apply adaptive thresholding to convert to binary image suitable for OCR."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    binary = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    return cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR)

def preprocess_for_ocr(image_bytes: bytes) -> bytes:
    """Run full preprocessing pipeline on raw image bytes."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        return image_bytes # Fallback if invalid
        
    image = deskew_image(image)
    image = denoise_image(image)
    image = enhance_contrast(image)
    image = adaptive_threshold(image)
    
    success, encoded_image = cv2.imencode('.png', image)
    if success:
        return encoded_image.tobytes()
    return image_bytes
