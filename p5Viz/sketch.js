import vision from "https://cdn.skypack.dev/@mediapipe/tasks-vision@latest";
const { GestureRecognizer, FilesetResolver } = vision;

let timestampLastTransmit = 0;
const MIN_TIME_BETWEEN_TRANSMISSIONS_MS = 50; // 50 ms is ~20 Hz

//particles visualization variables
let visualVariable = 0;

//gestures
let gestureVals = [];
let gestureCounter = 0;

//canvas settings
const settings = {
  canvasSize : [600, 600],
}

/* Initialization */
const demosSection = document.getElementById("demos");
let gestureRecognizer;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;
const videoHeight = "360px";
const videoWidth = "480px";

async function runDemo() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  )
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task"
    },
    runningMode: runningMode
  })
  demosSection.classList.remove("invisible")
}

const videoGesture = document.getElementById("webcam")
const canvasElement = document.getElementById("output_canvas")
const canvasCtx = canvasElement.getContext("2d")
const gestureOutput = document.getElementById("gesture_output");
// var hideVideo = document.getElementsByClassName("webcam")[0];
// hideVideo.style.display = "none";

// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton")
  enableWebcamButton.addEventListener("click", enableCam)
} else {
  console.warn("getUserMedia() is not supported by your browser")
}

// Enable the live webcam view and start detection.
function enableCam(event) {
  if (!gestureRecognizer) {
    alert("Please wait for gestureRecognizer to load")
    return
  }

  if (webcamRunning === true) {
    webcamRunning = false
    enableWebcamButton.innerText = "ENABLE PREDICTIONS"
  } else {
    webcamRunning = true
    enableWebcamButton.innerText = "DISABLE PREDICITONS"
  }

  // getUsermedia parameters
  const constraints = {
    video: true
  }

  // Activate the webcam stream
  navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    videoGesture.srcObject = stream;
    videoGesture.addEventListener("loadeddata", predictWebcam);
  })
}

//use webcam to predict hand pose
async function predictWebcam() {
  const webcamElement = document.getElementById("webcam")
  // Now let's start detecting the stream.
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO"
    await gestureRecognizer.setOptions({ runningMode: runningMode })
  }
  let nowInMs = Date.now()
  const results = gestureRecognizer.recognizeForVideo(videoGesture, nowInMs)

  canvasCtx.save()
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)

  canvasElement.style.height = videoHeight
  webcamElement.style.height = videoHeight
  canvasElement.style.width = videoWidth
  webcamElement.style.width = videoWidth

  canvasCtx.restore()
  let gestureName = "";
  if (results.gestures.length > 0) {
    gestureOutput.style.display = "block";
    gestureOutput.style.width = videoWidth;
    gestureName = results.gestures[0][0].categoryName;
    gestureOutput.innerText =
      "GestureRecognizer: " +
      gestureName +
      "\n Confidence: " +
      Math.round(parseFloat(results.gestures[0][0].score) * 100) +
      "%"
  } else {
    //if no hand, then output white
    gestureOutput.style.display = "none";
  }
  //if gesture is open palm or closed fist...
  if(gestureName === "Open_Palm"){
    console.log("open palm");
    gestureVals.push(1);
    // TODO: change snowflakes / visual here
  } else if (gestureName === "Closed_Fist"){
    console.log("fist");
    gestureVals.push(-1);
     // TODO: change snowflakes / visual here
  };
  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam)
  }
}

//get slider value and change corresponding parameters
const updateParams = () => {
  while (gestureVals.length > 0) {
    // Grab the least recent value of queue (first in first out)
    // JavaScript is not multithreaded, so we need not lock the queue
    // before reading/modifying.
    let gestureVal = gestureVals.shift();
    // console.log("gesture", gestureVal);
    gestureCounter = gestureCounter + gestureVal;
    if(gestureCounter > 10) {
      gestureCounter = 10;
    }if(gestureCounter < 1) {
      gestureCounter = 1;
    }
    visualVariable = gestureCounter;
  }
   console.log("visual variable value: ", visualVariable);
};

let snowflakes = []; // array to hold snowflake objects

// snowflake class
function snowflake(sketch) {
    // initialize coordinates
    this.posX = 0;
    this.posY = sketch.random(-50, 0);
    this.initialangle = sketch.random(0, 2 * sketch.PI);
    this.size = sketch.random(2, 5);
  
    // radius of snowflake spiral
    // chosen so the snowflakes are uniformly spread out in area
    this.radius = sketch.sqrt(sketch.random(sketch.pow(sketch.width / 2, 2)));
  
    this.update = function(time, sketch) {
      // x position follows a circle
      let w = 0.6; // angular speed
      let angle = w * time + this.initialangle;
      this.posX = sketch.width / 2 + this.radius * sketch.sin(angle);
  
      // different size snowflakes fall at slightly different y speeds
      this.posY += sketch.pow(this.size, 0.5);
  
      // delete snowflake if past end of screen
      if (this.posY > sketch.height) {
        let index = snowflakes.indexOf(this);
        snowflakes.splice(index, 1);
      }
    };
  
    this.display = function() {
        sketch.ellipse(this.posX, this.posY, this.size);
    };
  }

/* Timing */
let sketch = new p5((sketch) => {

sketch.setup = () => {
    //canvas setup
    let canvas = sketch.createCanvas(...settings.canvasSize);
    canvas.parent('sketch-container');
    sketch.fill(240);
    sketch.noStroke();
    //run wecam
    runDemo();
  }
  // run each frame
  sketch.draw = () => {
    updateParams();
    sketch.background('brown');
    let t = sketch.frameCount / 60; // update time
  
    // create a random number of snowflakes each frame
    for (let i = 0; i < sketch.random(5); i++) {
      snowflakes.push(new snowflake(sketch)); // append snowflake object
    }
  
    // loop through snowflakes with a for..of loop
    for (let flake of snowflakes) {
      flake.update(t, sketch); // update snowflake position
      flake.display(sketch); // draw snowflake
    }
  }
});