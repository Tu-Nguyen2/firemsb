This is the README for yolo specific functionality.

The first function of use is `convert_to_mp4` which is the first step of video processing as it converts a movie from MOV to mp4. This allows all other tools and specifically `synthesize_key_frames` to work as expected. Without conversion there is a high likelyhood that the following functions will not work correctly: `slowdown_video_function` and `synthesize_key_frames` 

the `slowdown_video_function` allows the user to specify the path to file, and also the rate at which to return a new saved file at (this does not affect running the next function `synthesize_key_frames_with_smooth_trajectory`).

`synthesize_key_frames_with_smooth_trajectory` is function that does the heavy lifting, this allows for tracking the object in frame over the duration of the video. 


