// import * as canvas from "canvas";
// import * as faceapi from "face-api.js";
// const { Canvas, Image, ImageData } = canvas;
// faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

export async function initializeFaceDetector() {
  //   // Initiating the models
  //   await faceapi.nets.faceRecognitionNet.loadFromDisk(`${__dirname}/models`);
  //   await faceapi.nets.faceLandmark68Net.loadFromDisk(`${__dirname}/models`);
  //   await faceapi.nets.ssdMobilenetv1.loadFromDisk(`${__dirname}/models`);
}
export async function faceDetector(file: any) {
  return true;
  // try {
  //   const img = await canvas.loadImage(file);
  //   const data = await faceapi.detectSingleFace(img);
  //   return data !== undefined;
  // } catch (_) {
  //   return false;
  // }
}
