from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import cv2
import ffmpeg
from ultralytics import YOLO
import torch
import firebase_admin
from firebase_admin import credentials, storage

cred = credentials.Certificate("./msbuddy-69e38-firebase-adminsdk-h1gp2-7d089744a7.json")
firebase_admin.initialize_app(cred, {
    'storageBucket': 'msbuddy-69e38.firebasestorage.app'
})


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:4200"}})

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


def convert_to_mp4(input_file, output_file=None):
    try:
        if output_file is None:
            output_file = input_file.rsplit(".", 1)[0] + ".mp4"
        cap = cv2.VideoCapture(input_file)
        if not cap.isOpened():
            raise FileNotFoundError(f"Cannot open video file: {input_file}")
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(output_file, fourcc, fps, (width, height))
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            out.write(frame)
        cap.release()
        out.release()
        return output_file
    except Exception as e:
        raise ValueError(f"Error in video conversion: {str(e)}")

def synthesize_key_frames_with_smooth_trajectory(input_video, output_video, model_path, frame_skip=1, handedness="right"):
    try:
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        model = YOLO(model_path).to(device)

        cap = cv2.VideoCapture(input_video)
        if not cap.isOpened():
            raise ValueError(f"Could not open video file {input_video}")

        input_fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        if input_fps == 0 or width == 0 or height == 0:
            cap.release()
            raise ValueError("Invalid video properties. Please check the video file.")

        output_directory = os.path.dirname(output_video)
        os.makedirs(output_directory, exist_ok=True)

        # Define the video writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_video, fourcc, input_fps, (width, height))
        if not out.isOpened():
            cap.release()
            raise ValueError("VideoWriter failed to open.")

        accumulated_positions = []
        frame_id = 0

        # Define thresholds for suspicious detection
        suspicious_x_threshold = width * 0.8 if handedness.lower() == "left" else width * 0.2
        suspicious_y_threshold = height * 0.8

        driver_count, iron_count = 0, 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_id % frame_skip == 0:
                results = model(frame)
                club_head_detected = False

                for box in results[0].boxes:
                    class_id = int(box.cls[0])
                    if class_id == 0:  # Club head class
                        x_center, y_center = int(box.xywh[0][0]), int(box.xywh[0][1])
                        if (handedness.lower() == "left" and x_center >= suspicious_x_threshold and y_center >= suspicious_y_threshold) or \
                           (handedness.lower() == "right" and x_center <= suspicious_x_threshold and y_center >= suspicious_y_threshold):
                            print(f"Skipping suspicious detection at ({x_center}, {y_center})")
                        else:
                            club_head_detected = True
                            accumulated_positions.append((x_center, y_center))
                        break
                    elif class_id == 1:  # Driver class
                        driver_count += 1
                    elif class_id == 2:  # Iron class
                        iron_count += 1

                if not club_head_detected:
                    print(f"Club head not detected in frame {frame_id}")

            # Draw trajectory
            for i in range(1, len(accumulated_positions)):
                cv2.line(frame, accumulated_positions[i - 1], accumulated_positions[i], (0, 255, 0), 2)
            if accumulated_positions:
                cv2.circle(frame, accumulated_positions[-1], 5, (0, 0, 255), -1)

            out.write(frame)
            frame_id += 1

        cap.release()
        out.release()

        # Determine club type
        if driver_count > iron_count:
            return "Driver"
        elif iron_count > driver_count:
            return "Iron"
        else:
            return "Uncertain"
    except Exception as e:
        print(f"Error in synthesize_key_frames_with_smooth_trajectory: {str(e)}")
        raise



@app.route('/')
def index():
    return jsonify({"message":"test message"})

@app.route('/upload', methods=['POST'])
def upload():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No filename provided"}), 400

        original_file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(original_file_path)

        converted_file_path = convert_to_mp4(original_file_path)
        return jsonify({
            "message": "Upload complete",
            "file_path": converted_file_path
        }), 200
    except Exception as e:
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

@app.route('/process', methods=['POST'])
def process_video():
    try:
        data = request.json
        input_file = data.get("file_path")
        handedness = data.get("handedness", "right").lower()
        user_id = data.get("user_id")

        if not user_id:
            return jsonify({"error": "User ID is required"}), 400

        if not input_file or not os.path.exists(input_file):
            return jsonify({"error": "File not found"}), 400

        user_folder = os.path.join(UPLOAD_FOLDER, "processed_videos", user_id)
        os.makedirs(user_folder, exist_ok=True)
        processed_file_name = os.path.basename(input_file).rsplit(".", 1)[0] + "_processed.mp4"
        processed_file_path = os.path.join(user_folder, processed_file_name)

        model_path = "./yolo/models/myswingbuddyV2_best/weights/best.pt"
        clubtype = synthesize_key_frames_with_smooth_trajectory(
            input_file, processed_file_path, model_path, frame_skip=1, handedness=handedness
        )
 
        bucket = storage.bucket()
        blob_path = f'processed_videos/{user_id}/{processed_file_name}'
        blob = bucket.blob(blob_path)
        blob.upload_from_filename(processed_file_path)
        blob.make_public()
        firebase_url = blob.public_url

        return jsonify({
            "message": "Processed successfully",
            "clubtype": clubtype,
            "videoprocessedurl": firebase_url,
            "wtps": "Placeholder for calculated WTPS"
        }), 200
    except Exception as e:
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)