from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import cv2
import ffmpeg
from ultralytics import YOLO
import torch

def convert_to_mp4(input_file, output_file=None):
    if output_file is None:
        output_file = input_file.rsplit(".", 1)[0] + ".mp4"

    probe = ffmpeg.probe(input_file)
    video_stream = next((stream for stream in probe['streams'] if stream['codec_type'] == 'video'), None)

    if video_stream and 'tags' in video_stream and 'rotate' in video_stream['tags']:
        rotate_angle = int(video_stream['tags']['rotate'])
        if rotate_angle == 90:
            vf = 'transpose=1'
        elif rotate_angle == 180:
            vf = 'transpose=2'
        elif rotate_angle == 270:
            vf = 'transpose=2,transpose=2'
        else:
            vf = None
    else:
        vf = None

    if vf:
        ffmpeg.input(input_file).output(
            output_file,
            vcodec='mpeg4',  
            acodec='aac',      
            vf=vf           
        ).run()
    else:
        
        ffmpeg.input(input_file).output(
            output_file,
            vcodec='mpeg4',  
            acodec='aac'       
        ).run()

    return output_file

def synthesize_key_frames_with_smooth_trajectory(input_video, output_video, model_path, frame_skip=1, handedness="right"):
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

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_video, fourcc, input_fps, (width, height))
    if not out.isOpened():
        cap.release()
        raise ValueError("VideoWriter failed to open.")

    accumulated_positions = []
    frame_id = 0

    if handedness.lower() == "left":
        suspicious_x_threshold = width * 0.8
    else:
        suspicious_x_threshold = width * 0.2
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
                if class_id == 0:
                    x_center, y_center = int(box.xywh[0][0]), int(box.xywh[0][1])
                    if (handedness.lower() == "left" and x_center >= suspicious_x_threshold and y_center >= suspicious_y_threshold) or \
                       (handedness.lower() == "right" and x_center <= suspicious_x_threshold and y_center >= suspicious_y_threshold):
                        print(f"Skipping suspicious detection at ({x_center}, {y_center})")
                    else:
                        club_head_detected = True
                        accumulated_positions.append((x_center, y_center))
                    break
                elif class_id == 1:
                    driver_count += 1
                elif class_id == 2:
                    iron_count += 1

            if not club_head_detected:
                print(f"Club head not detected in frame {frame_id}")

        for i in range(1, len(accumulated_positions)):
            cv2.line(frame, accumulated_positions[i - 1], accumulated_positions[i], (0, 255, 0), 2)
        if accumulated_positions:
            cv2.circle(frame, accumulated_positions[-1], 5, (0, 0, 255), -1)

        out.write(frame)
        frame_id += 1

    cap.release()
    out.release()

    if driver_count > iron_count:
        return "Driver"
    elif iron_count > driver_count:
        return "Iron"
    else:
        return "Uncertain"


app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return jsonify({"message":"test message"})

@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return jsonify({"error":"no file"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error":"Not a valid file"}), 400

    allowed_extensions = {'mp4', 'mov', 'gp3'}

    if '.' in file.filename and file.filename.rsplit('.',1)[1].lower() not in allowed_extensions:
        return jsonify({"error": "not the correct format"}), 400
    
    upload_folder = "./uploads"
    os.makrdirs(upload_folder, exist_ok=True)

    original_file_path = os.path.join(upload_folder, file.filename)
    file.save(original_file_path)
    
    converted_fpath = original_file_path.rsplit(".",1)[0]+".mp4"
    try:
        convert_to_mp4(original_file_path, converted_fpath)

    except Exception as e:
        return jsonify({"error": f"Failed to convert to mp4: {str(e)}"}), 500

    return jsonify({
        "message": "upload complete",
        "file_path": converted_fpath}), 200

@app.route('/process', methods=['POST'])
def process_video():
    data = request.json
    input_file = data.get("file_path")
    handedness = data.get("handedness", "right").lower()

    if not input_file or not os.path.exists(input_file):
        return {"error": "File not found"}, 400
    
    processed_file = input_file.rsplit(".",1)[0] + "_processed.mp4"

    try:
        clubtype = synthesize_key_frames_with_smooth_trajectory(
            input_file,
            processed_file,
            model_path="./yolo/models/myswingbuddyV2_best/weights/best.pt",
            frame_skip=1,
            handedness=handedness
        )
        print(f"Processed video saved {processed_file}")
    except Exception as e:
        return jsonify({"error": f"Processing failed debug: {str(e)}"}), 500


    return jsonify({
        "message": "processed",
        "clubtype": clubtype,
        "videoprocessedurl": processed_file
    }), 200


if __name__ == '__main__':
    app.run(debug=True)