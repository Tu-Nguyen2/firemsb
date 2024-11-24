from flask import Flask, request, jsonify
from flask_cors import CORS

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
    file.save(f"./uploads/{file.filename}")
    return jsonify({"message": "upload complete"}), 200


if __name__ == '__main__':
    app.run(debug=True)