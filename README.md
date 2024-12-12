# MySwingBuddy

MySwingBuddy is a project that allows the user to login using Firebase, to access their account where they will be able to upload videos of themselves swinging a golf club. Over the duration of the video the user will have the points on the video, where the head of the golf club travels throughout the duration, mapped and the video will be returned to the user. The user will then be able to take notes on their swing, as well as being able to see what professional players are doing for that type of swing (based on research of what professional golfers do for their swing). Each video has the orignal video saved, and there is a version of the video that allows for the user to see the original swing and the overlay for that swing. 


## Required Software
* Node.js (version 20.17.0 or higher)
* Angular CLI (version 18.2.6 or higher)
* Firebase CLI (latest version)
* Python 3.9 or higher
* Pip to install packges (see flask section)
* CUDA 11.8 (if using NVIDA GPU)

### Installations and Configuration After Cloning - Web Component
After cloning MySwingBuddy, you will need to create a Firebase console account. Once created, click on "Add project", follow the setup steps.

After setting up a new Firebase project , `cd` into where `MySwingBuddy` is cloned. The next step is installing dependencies and other tools that will be needed to run all code. 

`npm install` will install Node.js dependencies for the project.

`npm install -g firebase-tools` will now install the Firebase CLI, this allows us to push the project and connect an Firbase account to manage user login. Next you should run `firebase login` in a terminal window. This will allow you to sign into your Firebase account. Now you can run `firebase init` and this will let you select the services used: Firestore, Storage, and Authentication.


With these installed, an `enviroments.ts` will need to be created. In the `src` directory create a new directory called `src/enviromnet`, within here is where `enviroment.ts` will be located. Below is an example structure of how the enviroment should be setup.

```typescript
export const environment = { 
    production: false, 
    apiKey: 'your-api-key', 
    authDomain: 'your-auth-domain', 
    projectId: 'your-project-id', 
    storageBucket: 'your-storage-bucket', 
    messagingSenderId: 'your-messaging-sender-id', 
    appId: 'your-app-id' 
}; 
```

Replace the placeholder values with actual configuration values. These can be obtained from the Firebase console or another backend provider as per your project’s requirements. If using this code a new application within Firebase, you will need to create a new application within the console to set up the retrieve values.

Additionally, through using the Firebase console, if this is added to a new project, go into `Project Settings` under the `Service Accounts` tab there is a button at the bottom that says `Generate new private key`. Clicking that button will download a .json file that has all service details of the account.

> **Note:** If this does not work, please contact Tu-Nguyen2, or paul-pilipczuk for the specific environment being used in this project.

Within the `src` folder there are the also components and pages for the web application, these are organized by what the function of the page is and they route between eachother.

## Flask Installations and Configuration After Cloning 
Currently the packages being used for video playback control and any transformations to the data itself can be found in `yolo` folder. Within here `video_tools_XXX.py` files that contain scripts that will be used for video processing for different setups. These were the building blocks of the `flask_server` folder. Create a virtual enviroment

- pip (Python package manager)

### Steps to Set Up and Run

##### 1. Navigate to the Project Directory

Open a terminal or command prompt and navigate to the `flask_server` directory:

```bash
cd flask_server
```

##### 2. Create a Virtual Environment

Create a Python virtual environment in the `flask_server` directory:

```bash
python3 -m venv venv
```

This creates a folder named `venv` in the `flask_server` directory to store the virtual environment.

##### 3. Activate the Virtual Environment

#### On macOS and Linux:

```bash
source venv/bin/activate
```

#### On Windows:

```bash
venv\Scripts\activate
```

Once activated, you should see the virtual environment's name (e.g., `venv`) in your terminal prompt. (may not do this in VSCode)

#### 4. Install Dependencies

With the virtual environment activated, install the required dependencies listed in `requirements.txt`:

```bash
pip install -r requirements.txt
```

This will install all necessary Python packages into the virtual environment, including those needed for CUDA 11.8.
> Ensure you are using the venv

#### 5. Run the Flask Server

Run your Flask server by executing the Python script:

```bash
python app.py
```

## Usage

Run `ng serve` for a dev server, since the project is locally hosted this will be the only way to run the project. The project will be accessable at [http://localhost:4200](http://localhost:4200).

## Contributing

This project was created by Tu-Nguyen2 and paul-pilipczuk. Any questions should be directed to either developer on the project, please do not hesitate to reach out.