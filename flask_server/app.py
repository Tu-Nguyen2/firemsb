from flask import Flask, request, jsonify
from flask_cors import CORS
import os

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

    file_path = os.path.join(upload_folder, file.filename)
    file.save(file_path)
    # file.save(f"./uploads/{file.filename}")
    return jsonify({"message": "upload complete", "file_path": file_path}), 200

@app.route('/process', methods=['POST'])
def process_video():
    data = request.json
    input_file = data.get("file_path")
    if not input_file or not os.path.exists(input_file):
        return {"error": "File not found"}, 400
    
    output_file = run_yolo_processes(input_file)

    return jsonify({
        "message": "processed",
        "output_file": output_file
    }), 200


if __name__ == '__main__':
    app.run(debug=True)