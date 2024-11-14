# MySwingBuddy

MySwingBuddy is a project that allows the user to login using Firebase, to access their account where they will be able to upload videos of themselves swinging a golf club. Over the duration of the video the user will have the points on the video, where the head of the golf club travels throughout the duration, mapped and the video will be returned to the user. The user will then be able to take notes on their swing, as well as being able to see what professional players are doing for that type of swing (based on research of what professional golfers do for their swing). Each video has the orignal video saved, and there is a version of the video that allows for the user to see the original swing and the overlay for that swing. 


## Required Software
* Node.js (version 20.17.0 or higher)
* Angular CLI (version 18.2.6 or higher)
* Firebase CLI (latest version)
* Python 3.9 or higher
* FFmpeg (installed and added to PATH)
* Ultralytics for using the model

### Installations and Configuration After Cloning - Web Component
Once the repo is cloned, `cd` into where `MySwingBuddy` is cloned. The next step is installing dependencies and other tools that will be needed to run all code.

`npm install` will install Node.js dependencies for the project.

`npm install -g firebase-tools` will now install the Firebase CLI, this allows us to push the project and connect an Firbase account to manage user login. This also gives acced to adding in a 

With these installed, an `enviroments.ts` will need to be created. In the `src` directory create a new directory called `src/enviromnet`, within here is where `enviroment.ts` will be located. Below is an example structure of how the enviroment should be setup.

```export const environment = { production: false, apiKey: 'your-api-key', authDomain: 'your-auth-domain', projectId: 'your-project-id', storageBucket: 'your-storage-bucket', messagingSenderId: 'your-messaging-sender-id', appId: 'your-app-id' }; ```

Replace the placeholder values with actual configuration values. These can be obtained from the Firebase console or another backend provider as per your project’s requirements. If using this code a new application within Firebase, you will need to create a new application within the console to set up the retrieve values.

> **Note:** If this does not work, please contact Tu-Nguyen2, or paul-pilipczuk for the specific environment being used in this project.

Within the `src` folder there are the also components and pages for the web application, these are organized by what the function of the page is and they route between eachother.

### Installations and Configuration After Cloning - YOLO
Currently the packages being used for video playback control and any transformations to the data itself can be found in `yolo`, within here `video_tools.py` contains scripts that will be used for video processing. These require Ultralytics, OpenCV, and FFmpeg in order to function these can be installed by running:

`pip install opencv-python ffmpeg-python ultralytics`

> Make sure that after installing these, their path setup properly and firemsb can see those pathes.

## Usage

Run `ng serve` for a dev server, since the project is locally hosted this will be the only way to run the project. The project will be accessable at [http://localhost:4200](http://localhost:4200).

## Contributing

This project was created by Tu-Nguyen2 and paul-pilipczuk. To make any contributions to the project, please reach out to either developer.