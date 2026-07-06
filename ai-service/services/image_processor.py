import cv2
import numpy as np
import io
from PIL import Image
import base64

def enhance_camera_image(image_bytes: bytes) -> bytes:
    """
    Takes raw image bytes from a camera upload, applies OpenCV enhancements 
    (deskew, denoise, adaptive thresholding), and returns the cleaned image bytes.
    """
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return image_bytes # Fallback if decoding fails
            
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Denoise
        denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
        
        # Adaptive thresholding to remove shadows and enhance text
        # Using a large block size to handle uneven lighting in camera photos
        binary = cv2.adaptiveThreshold(
            denoised, 255, 
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 51, 15
        )
        
        # Auto-deskew (find orientation and rotate)
        coords = np.column_stack(np.where(binary < 255))
        if len(coords) > 0:
            angle = cv2.minAreaRect(coords)[-1]
            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle
                
            # Only correct if angle is significant
            if abs(angle) > 0.5:
                (h, w) = img.shape[:2]
                center = (w // 2, h // 2)
                M = cv2.getRotationMatrix2D(center, angle, 1.0)
                
                # Rotate the original color image
                img = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
                
                # Re-apply processing to rotated image
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
                binary = cv2.adaptiveThreshold(
                    denoised, 255, 
                    cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                    cv2.THRESH_BINARY, 51, 15
                )
                
        # Convert back to bytes (JPEG)
        # We return the enhanced grayscale binary image for better OCR
        is_success, buffer = cv2.imencode(".jpg", binary)
        if is_success:
            return buffer.tobytes()
            
        return image_bytes
        
    except Exception as e:
        print(f"Image enhancement error: {e}")
        return image_bytes

def image_to_base64(image_bytes: bytes) -> str:
    """Helper to convert image bytes to base64 for Groq Vision."""
    return base64.b64encode(image_bytes).decode('utf-8')
