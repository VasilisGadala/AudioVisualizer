// This program is an attempt to match colors and brightnesses to the energy/
// beats of a song. Some constants are chosen subjectively by my preference
// Further expansions of the program may read the audio file before playing
// and use a trained model to better determine these values. This is b/c
// the values work better for different genres.


var song;
var fft;
var mic;

var backgroundRGB;

// Variables related towards loading a color spectrum
var projectCTX;
var data;
var colorSpectrumWidth;

const canvasWidth = 1800;
const canvasHeight = 600

const startingColor = new Array(50, 50, 50);
const activeColor = new Array(50, 50, 50);
const songName = 'Camila Cabello - Havana (Lyrics) ft. Young Thug.mp3';

// Value used to change p5's fft smoothing attribute 
// This manages how fast a volume will change for each frequency,
// 0 being the fastest and 1 being the slowest [0, 1);
const fftSmoothing = 0.0; // (0, 1)

// Determines how many different frequencies we look at
const fftBands = Math.pow(2, 12); // 2^n

// Because the human ear hears more differences in changes in low frequencies, 
// this increases the spread of the low frequencies and tightens that of high frequencies,
// which makes audio analysis a bit easier
const logFactor = 1.1

// The human ear cant hear extremely low frequencies, so this starts a bit higher. This number
// Should be changed if the number of fft bands changes, however the exact value where we might
// want to read data is subjective, as it largely depends on speakers 
// (good quality speakers can produce lower frequencies than cheaper counterparts)
const startingValue = 4;

// Used solely for drawing purposes to keep the graph from getting too tall. Just a multiplier for the height
const powerIndex = 0.8

var newClr = new Array(0, 0, 0);

function preload() {
  song = loadSound(songName);
  backgroundRGB = startingColor;
}

function setup() {
  createCanvas(canvasWidth, canvasHeight + 1200);

  fft = new p5.FFT(fftSmoothing, fftBands);
  background(backgroundRGB[0], backgroundRGB[1], backgroundRGB[2])
  getRGB();

  // Uncomment (and comment fft initialization above) for mic:

  // mic = new p5.AudioIn();
  // mic.start();
  // fft = new p5.FFT();
  // fft.setInput(mic);
}

function jumpSong(value) {
  song.jump(song.currentTime() + value);
}

function toggleSong() {
  if (song.isPlaying()) {
    song.pause();
    backgroundRGB = startingColor;
  }
  else {
    song.play();
    backgroundRGB = activeColor;
  }
}

function mouseClicked() {
    toggleSong();
}


function getRGB() {
  const img = document.querySelector('#example'); 
  const canvas = document.createElement('canvas'); 
  var ctx = canvas.getContext('2d'); 

  canvas.width = img.width;
  canvas.height = img.height;

  colorSpectrumWidth = img.width;
  
  ctx.drawImage(img, 0, 0)

  projectCTX = ctx;
}

function keyPressed() {
  if (keyCode === LEFT_ARROW) {
    jumpSong(-5);
  } else if (keyCode === RIGHT_ARROW) {
    jumpSong(5);
  }
}

function draw() {


  background(backgroundRGB[0], backgroundRGB[1], backgroundRGB[2])
  let spectrum = fft.analyze();

  fill('white');
  text(song.currentTime(), canvasWidth/2, canvasHeight + 50);


  
  let count = 0
  let volumeSum = 0;
  var largestWindowSum = 0;  

  for (let i = startingValue; i < spectrum.length; i = logFactor * i) {
    let h =  min(0, -canvasHeight + 1/powerIndex * 256 * Math.pow(map(spectrum[Math.ceil(i)], 0, 256, canvasHeight, 0)/256, powerIndex)); 

    data = projectCTX.getImageData( 
      Math.min(colorSpectrumWidth - 1, Math.floor((count + 1) * (2/3) * colorSpectrumWidth/(fftBands/(Math.log2(spectrum.length)/Math.log2(logFactor))))), 0, width, height 
  ).data;

  if (count < 20) {
    volumeSum += spectrum[Math.ceil(i)];
  } else if (count < 60) {
    volumeSum += 2 * spectrum[Math.ceil(i)];
  } else {
    volumeSum += 2 * spectrum[Math.ceil(i)];
  }

  fill(data[0], data[1], data[2]);

  rect(count * width / (Math.log2(spectrum.length)/Math.log2(logFactor)), canvasHeight, width / (Math.log2(spectrum.length)/Math.log2(logFactor)), h);
    var windowVolumeAtFrequency = 0;

    // uses a sliding window of size 3 on the spectrum to determine the loudest set of frequencies, used to pick a color
    // (not the bars that are visible, the <fftbands> # of frequencies being interpreted by the program)
    for (let j = 0; j < 3; j += 1) {
      if (count < 22 ) {
        windowVolumeAtFrequency += spectrum[Math.floor(i + j)];
      } else if (count < 45) {
        windowVolumeAtFrequency += 1 * spectrum[Math.floor(i + j)];
      } else {
        windowVolumeAtFrequency += 1.1 * spectrum[Math.floor(i + j)];
      }
    }

    if (windowVolumeAtFrequency > largestWindowSum) {
      newClr = new Array(data[0], data[1], data[2]);
      largestWindowSum = windowVolumeAtFrequency;

    }
    count+=1;

  }


  // Change this power to make it less extreme
  fill(newClr[0] * (Math.min(1, Math.pow(Math.max(0, volumeSum - 5000)/14000, 2.5))),
       newClr[1] * (Math.min(1, Math.pow(Math.max(0, volumeSum - 5000)/14000, 2.5))),
       newClr[2] *(Math.min(1, Math.pow(Math.max(0, volumeSum - 5000)/14000, 2.5))));
  // fill(indexClr[0], indexClr[1], indexClr[2]);
  rect(1500, canvasHeight + 100, 300, 300);
  fill(0, 0, 0);
  text(volumeSum, 50, 50);

}
