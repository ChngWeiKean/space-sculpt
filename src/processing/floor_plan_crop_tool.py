from flask import Flask, request, jsonify, send_file
import cv2
import numpy as np
from io import BytesIO
from PIL import Image
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Crop floor plan function
@app.route('/crop-floorplan', methods=['POST'])
def crop_floorplan():
    # Check if an image file was uploaded
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    
    # Read the uploaded image
    image = Image.open(file.stream).convert('RGB')
    open_cv_image = np.array(image)
    image = open_cv_image[:, :, ::-1].copy()  # Convert RGB to BGR for OpenCV

    # Convert the image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply Gaussian blur
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Perform edge detection
    edges = cv2.Canny(blurred, 50, 150)
    
    # Find contours
    contours, _ = cv2.findContours(edges.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Filter for large contours
    large_black_lines = []
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        if w > 100 and h > 100:
            large_black_lines.append((x, y, w, h))
    
    # Find min/max coordinates of the bounding box
    min_x = min(line[0] for line in large_black_lines)
    min_y = min(line[1] for line in large_black_lines)
    max_x = max(line[0] + line[2] for line in large_black_lines)
    max_y = max(line[1] + line[3] for line in large_black_lines)
    
    # Add padding to the bounding box
    padding = 20
    x = max(0, min_x)
    y = max(0, min_y)
    w = min(image.shape[1], max_x - min_x + 2)
    h = min(image.shape[0], max_y - min_y + 2)
    
    # Crop the image
    cropped_image = image[y:y + h, x:x + w]

    # Convert the cropped image back to PIL format
    cropped_pil_image = Image.fromarray(cv2.cvtColor(cropped_image, cv2.COLOR_BGR2RGB))

    # Prepare the image to send back to React
    byte_io = BytesIO()
    cropped_pil_image.save(byte_io, 'PNG')
    byte_io.seek(0)

    return send_file(byte_io, mimetype='image/png')

if __name__ == '__main__':
    app.run(debug=True)