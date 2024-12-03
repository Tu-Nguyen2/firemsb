from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import cv2
import ffmpeg
import uuid
from ultralytics import YOLO
import torch
import firebase_admin
from firebase_admin import credentials, storage
import traceback
import subprocess
import mediapipe as mp

cred = credentials.Certificate("./msbuddy-69e38-firebase-adminsdk-h1gp2-7d089744a7.json")
firebase_admin.initialize_app(cred, {
    'storageBucket': 'msbuddy-69e38.firebasestorage.app'
})


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:4200"}})

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

ffmpeg_path = r"C:\ffmpeg\ffmpeg-7.1-full_build\bin\ffmpeg.exe"



def convert_to_mp4(input_file, output_file=None):
    """
    Converts a video file to MP4 using FFmpeg and the libx264 codec.
    """
    try:
        if output_file is None:
            output_file = input_file.rsplit(".", 1)[0] + ".mp4"

        if not os.path.exists(input_file):
            raise FileNotFoundError(f"Input file not found: {input_file}")
        print(f"Converting file: {input_file} to {output_file}")

        # Path to FFmpeg (ensure FFmpeg is installed and in PATH)
        ffmpeg_command = [
            ffmpeg_path,  
            "-i", input_file,        # Input file
            "-c:v", "libx264",       # Use libx264 for video encoding
            "-preset", "fast",       # Encoding speed/quality tradeoff
            "-crf", "23",            # Constant Rate Factor (lower is better quality)
            "-c:a", "aac",           # Use AAC for audio encoding
            "-b:a", "128k",          # Set audio bitrate
            "-movflags", "faststart",# Optimize for streaming
            output_file              # Output file
        ]

        print("Running FFmpeg command:", " ".join(ffmpeg_command))
        result = subprocess.run(ffmpeg_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        # Check for success
        if result.returncode != 0:
            print(f"FFmpeg STDERR: {result.stderr}")
            raise Exception(f"FFmpeg failed with error: {result.stderr}")

        print(f"Conversion complete: {output_file}")
        return output_file

    except Exception as e:
        print(f"Error in convert_to_mp4: {e}")
        raise


def synthesize_key_frames_with_smooth_trajectory(input_video, output_video, model_path, frame_skip=1, handedness="right", batch_size=8):
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
        fourcc = cv2.VideoWriter_fourcc(*'avc1')  # Use H.264 codec
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

        #used for batching
        frame_batch = []
        frame_indices = []

        # Mediapipe setup, list of connections we need
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose(static_image_mode=False, model_complexity=1)

        BODY_CONNECTIONS = [
            (mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.RIGHT_SHOULDER),
            (mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.LEFT_ELBOW),
            (mp_pose.PoseLandmark.LEFT_ELBOW, mp_pose.PoseLandmark.LEFT_WRIST),
            (mp_pose.PoseLandmark.RIGHT_SHOULDER, mp_pose.PoseLandmark.RIGHT_ELBOW),
            (mp_pose.PoseLandmark.RIGHT_ELBOW, mp_pose.PoseLandmark.RIGHT_WRIST),
            (mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.LEFT_HIP),
            (mp_pose.PoseLandmark.RIGHT_SHOULDER, mp_pose.PoseLandmark.RIGHT_HIP),
            (mp_pose.PoseLandmark.LEFT_HIP, mp_pose.PoseLandmark.RIGHT_HIP),
            (mp_pose.PoseLandmark.LEFT_HIP, mp_pose.PoseLandmark.LEFT_KNEE),
            (mp_pose.PoseLandmark.LEFT_KNEE, mp_pose.PoseLandmark.LEFT_ANKLE),
            (mp_pose.PoseLandmark.RIGHT_HIP, mp_pose.PoseLandmark.RIGHT_KNEE),
            (mp_pose.PoseLandmark.RIGHT_KNEE, mp_pose.PoseLandmark.RIGHT_ANKLE),
        ]

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_id % frame_skip == 0:
                frame_batch.append(frame)
                frame_indices.append(frame_id)

            # Process batch when its full
            if len(frame_batch) == batch_size:
                results = model(frame_batch)  # Perform inference on batch
                for idx, result in enumerate(results):
                    club_head_detected = False

                    for box in result.boxes:
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
                        print(f"Club head not detected in frame {frame_indices[idx]}")

                    # Draw trajectory on the frame
                    for i in range(1, len(accumulated_positions)):
                        cv2.line(frame_batch[idx], accumulated_positions[i - 1], accumulated_positions[i], (50, 30, 250), 2)
                    if accumulated_positions:
                        cv2.circle(frame_batch[idx], accumulated_positions[-1], 5, (0, 0, 255), -1)

                    # draw the mediapipe wireframe
                    frame_rgb = cv2.cvtColor(frame_batch[idx], cv2.COLOR_BGR2RGB)
                    pose_results = pose.process(frame_rgb)

                    if pose_results.pose_landmarks:
                        landmarks = pose_results.pose_landmarks.landmark
                        for start, end in BODY_CONNECTIONS:
                            if landmarks[start].visibility > 0.5 and landmarks[end].visibility > 0.5:
                                start_point = (int(landmarks[start].x * width), int(landmarks[start].y * height))
                                end_point = (int(landmarks[end].x * width), int(landmarks[end].y * height))
                                cv2.line(frame_batch[idx], start_point, end_point, (0, 50, 255), 2)

                    out.write(frame_batch[idx])  # Write the processed frame with pose and traj to output video

                frame_batch.clear()
                frame_indices.clear()

            frame_id += 1

        cap.release()
        out.release()
        pose.close()

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

        
        processed_file_name = os.path.basename(input_file).rsplit(".", 1)[0] + "_processed.mp4"
        processed_file_path = os.path.join(UPLOAD_FOLDER, "processed_videos", user_id, processed_file_name)
        os.makedirs(os.path.dirname(processed_file_path), exist_ok=True)

        
        model_path = "./yolo/models/myswingbuddyV2_best/weights/best.pt"
        clubtype = synthesize_key_frames_with_smooth_trajectory(
            input_file, processed_file_path, model_path, frame_skip=1, handedness=handedness
        )
        
        token = str(uuid.uuid4())
        metadata = {
            "firebaseStorageDownloadTokens": token
        }

        # Upload to Firebase Storage 
        bucket = storage.bucket()
        blob_path = f'users/{user_id}/processed_videos/{processed_file_name}'
        blob = bucket.blob(blob_path)

        blob.upload_from_filename(processed_file_path, content_type='video/mp4')
        blob.metadata = metadata
        blob.patch()  

        firebase_url = f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/{blob_path.replace('/', '%2F')}?alt=media&token={token}"

        return jsonify({
            "message": "Processed successfully",
            "clubtype": clubtype,
            "videoprocessedurl": firebase_url
        }), 200

    except Exception as e:
        print(f"Error in /process: {str(e)}")
        traceback.print_exc()  
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True)