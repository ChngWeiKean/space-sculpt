from flask import Flask, request, jsonify
import cv2
import numpy as np
from io import BytesIO
from PIL import Image
import base64
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

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

    # --- Resize image based on aspect ratio ---
    original_height, original_width = image.shape[:2]
    
    # Recommended maximum size
    max_width = 1024
    max_height = 1024

    # Calculate aspect ratio
    aspect_ratio = original_width / original_height

    # Resize based on aspect ratio
    if original_width > original_height:
        new_width = max_width
        new_height = int(new_width / aspect_ratio)
    else:
        new_height = max_height
        new_width = int(new_height * aspect_ratio)

    # Resize the image while keeping aspect ratio
    image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)

    # Convert the image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply Gaussian blur
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Perform edge detection
    edges = cv2.Canny(blurred, 50, 150)
    
    # Find contours for cropping
    contours, _ = cv2.findContours(edges.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Filter for large contours
    large_black_lines = []
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        if w > 100 and h > 100:
            large_black_lines.append((x, y, w, h))
    
    # If no large contours found, return an error
    if not large_black_lines:
        return jsonify({'error': 'No valid contours found'}), 400
    
    # Find min/max coordinates of the bounding box for cropping
    min_x = min(line[0] for line in large_black_lines)
    min_y = min(line[1] for line in large_black_lines)
    max_x = max(line[0] + line[2] for line in large_black_lines)
    max_y = max(line[1] + line[3] for line in large_black_lines)
  
    x = max(0, min_x)
    y = max(0, min_y)
    w = min(image.shape[1], max_x - min_x)
    h = min(image.shape[0], max_y - min_y)
    
    # Crop the image
    cropped_image = image[y:y + h, x:x + w]

    # Convert the cropped image back to PIL format
    cropped_pil_image = Image.fromarray(cv2.cvtColor(cropped_image, cv2.COLOR_BGR2RGB))

    # Wall detection on cropped image (similar to room detection)
    gray_cropped = cv2.cvtColor(cropped_image, cv2.COLOR_BGR2GRAY)
    edges_cropped = cv2.Canny(gray_cropped, 50, 150)
    contours_cropped, _ = cv2.findContours(edges_cropped.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    detected_rooms = []
    detected_walls = []

    for i, contour in enumerate(contours_cropped):
        x_room, y_room, w_room, h_room = cv2.boundingRect(contour)

        if w_room > 30 and h_room > 30:
            aspect_ratio = w_room / float(h_room)
            area = w_room * h_room

            if (aspect_ratio < 0.5 or aspect_ratio > 2.0) or area < 100:
                continue
                
            room_data = {
                'x': int(x_room + x),  # Convert to Python int
                'y': int(y_room + y),  # Convert to Python int
                'width': int(w_room),   # Convert to Python int
                'height': int(h_room),  # Convert to Python int
                'label': f'Room {len(detected_rooms) + 1}'  
            }
            detected_rooms.append(room_data)

    # Apply Hough Transform to detect lines
    lines = cv2.HoughLinesP(edges_cropped, 1, np.pi / 180, threshold=100, minLineLength=50, maxLineGap=10)
    print(f"Detected {len(lines)} lines.")

    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]

            # Create a bounding box for the wall
            wall_data = {
                'x': int(min(x1, x2)),  # No need to add 'x' offset since 'x1' and 'x2' are from cropped image
                'y': int(min(y1, y2)),  # No need to add 'y' offset since 'y1' and 'y2' are from cropped image
                'width': int(abs(x2 - x1)),  # Width of the wall
                'height': int(abs(y2 - y1)),  # Height of the wall
                'length': int(max(abs(x2 - x1), abs(y2 - y1)))  # Length of the wall
            }
            detected_walls.append(wall_data)

            # Highlight the walls by drawing lines on the image
            # color = (0, 255, 0)  # Green color for walls
            # cv2.line(cropped_image, (x1, y1), (x2, y2), color, 2)
    else:
        print("No lines detected.")

    # Convert the modified cropped image back to PIL format
    cropped_pil_image_with_boxes = Image.fromarray(cv2.cvtColor(cropped_image, cv2.COLOR_BGR2RGB))

    # Convert the image to bytes and encode it to base64
    byte_io = BytesIO()
    cropped_pil_image_with_boxes.save(byte_io, 'PNG')
    byte_io.seek(0)
    base64_image = base64.b64encode(byte_io.getvalue()).decode('utf-8')

    print("Detected Walls:", detected_walls)

    # Prepare the response with base64 encoded image, detected rooms, and detected walls
    response = {
        'image': base64_image,
        'rooms': detected_rooms,
        'walls': detected_walls
    }

    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)
