import ffmpeg
import os
import cv2
import torch
import numpy as np
from torch.cuda.amp import autocast #this is specifically used for Nvidia graphics cards that have CUDA support 
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
from ultralytics import YOLO

def convert_to_mp4(input_file, output_file=None):
    if output_file is None:
        output_file = input_file.rsplit(".", 1)[0] + ".mp4"

    # Get the metadata, including the rotation
    probe = ffmpeg.probe(input_file)
    video_stream = next((stream for stream in probe['streams'] if stream['codec_type'] == 'video'), None)

    # Determine if rotation metadata and rotate
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

    # Build the ffmpeg command
    if vf:
        ffmpeg.input(input_file).output(
            output_file,
            vcodec='libx264',  # Video codec for MP4 output
            acodec='aac',      # Ensure audio is in AAC format for compatibility
            vf=vf              # Apply the calculated video filter for rotation
        ).run()
    else:
        # If no rotation is needed, process without the vf flag
        ffmpeg.input(input_file).output(
            output_file,
            vcodec='libx264',  # Video codec for MP4 output
            acodec='aac'       # Ensure audio is in AAC format for compatibility
        ).run()

    # # Delete the original MOV file after conversion   No longer need to delete
    # if os.path.exists(input_file):
    #     os.remove(input_file)
    #     print(f"Deleted the original file: {input_file}")
    # else:
    #     print(f"File {input_file} not found, unable to delete.")


def slow_down_video(input_video, output_video=None, slow_factor=0.4):
    # Set the default output video name if not provided
    if output_video is None:
        output_video = input_video.rsplit('.', 1)[0] + '_slowed.mp4'

    # Video filter: slow down by changing the presentation timestamp (PTS)
    video_filter = f"setpts={1 / slow_factor}*PTS"

    # Apply only the video filter (since there's no audio)
    ffmpeg.input(input_video).output(
        output_video,
        vf=video_filter
    ).run()

    print(f"Slowed down video saved as: {output_video}")


def synthesize_key_frames_with_smooth_trajectory(input_video, output_video, model_path, frame_skip=6,handedness="right"):
    device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
    model = YOLO(model_path).to(device)

    cap = cv2.VideoCapture(input_video)
    if not cap.isOpened():
        print(f"Error: Could not open video file {input_video}")
        return

    input_fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    if input_fps == 0 or width == 0 or height == 0:
        print("Error: Invalid video properties. Please check the video file.")
        cap.release()
        return

    print(f"Input video properties - FPS: {input_fps}, Width: {width}, Height: {height}")

    output_directory = os.path.dirname(output_video)
    os.makedirs(output_directory, exist_ok=True)

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_video, fourcc, input_fps, (width, height))

    if not out.isOpened():
        print("Error: VideoWriter failed to open.")
        cap.release()
        return

    accumulated_positions = []
    frame_id = 0

    if handedness.lower() == "left":
        suspicious_x_threshold = width * 0.8
    else:
        suspicious_x_threshold = width * 0.2

    suspicious_y_threshold = height * 0.8

    driver_count = 0
    iron_count = 0

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
                    if (
                            handedness.lower() == "left" and x_center >= suspicious_x_threshold and y_center >= suspicious_y_threshold) or \
                            (
                                    handedness.lower() == "right" and x_center <= suspicious_x_threshold and y_center >= suspicious_y_threshold):
                        print(
                            f"Skipping suspicious {handedness}-handed detection at ({x_center}, {y_center}) in frame {frame_id}")
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
            start_point = accumulated_positions[i - 1]
            end_point = accumulated_positions[i]
            cv2.line(frame, start_point, end_point, (0, 50, 255), 4)

        if accumulated_positions:
            latest_position = accumulated_positions[-1]
            cv2.circle(frame, latest_position, 5, (0, 0, 255), -1)


        #below, from line 160-165, this is a debugging frame 
        cv2.imshow("Processed Frame", frame)
        if cv2.waitKey(1) == ord('q'):
            break
        print(f"Processed frame {frame_id} and writing to video.")
        out.write(frame)
        frame_id += 1

    cap.release()
    out.release()
    cv2.destroyAllWindows()
    print("Finished synthesizing video with gradually drawn trajectory and saved to:", output_video)

    if driver_count > iron_count:
        return "Driver"
    elif iron_count > driver_count:
        return "Iron"
    else:
        return "Uncertain (equal counts or no detections)"

if __name__ == "__main__":

    """
    This is a specifc example of how the outlined tools will work for processing video uploads
    First the file must be converted to mp4, this ensures no issues when tracking. In tests, I have found
    that avc1 is great if using an M series macbook, but using CUDA works best with the mp4v encoding.

    Second, the video will then have the trajectory applied, this has a couple extra steps, since handedness must
    come from the user profile, instead of being a direct input field.

    Ideally, this is all that needs to be done to process the trajectory of a video
    """

    # slowed_video_path = '/Users/paul/PycharmProjects/YOLOtests/fieldvideos/IMG_0406_slowed.mp4'
    #convert_to_mp4("./fieldvideos/IMG_0401.mov")
    output_video_path = r'C:\Users\Paul\Desktop\YOLOtests\output\2_1_3test.mp4' #specify the output location here
    model_path = './models/myswingbuddyV2_best/weights/best.pt'

    input_video_path = r'C:\Users\Paul\Desktop\YOLOtests\fieldvideos\IMG_0401.mp4' #specify where the video is located here
    # # Apply slowdown to the input video
    # slow_down_video(input_video_path, slowed_video_path, slow_factor=0.4)

    # Process the slowed video to add trajectory
    synthesize_key_frames_with_smooth_trajectory(input_video_path, output_video_path, model_path, frame_skip=1, handedness="right")

