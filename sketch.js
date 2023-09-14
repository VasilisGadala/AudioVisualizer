var backgroundRGB = new Array(0, 0, 0);
var song;
var fft;
var mic;
var data;
var outerCount = 0;

var colorMap = new Map();
for (i = 0; i < 73; i += 1) {
  colorMap.set(i, 'rgb(0,0,0)');
}

var colorSpectrumWidth;
var projectCTX;

const canvasHeight = 800;
const canvasWidth = 1600;

const songName = 'Can\'t Hold Us (feat. Ray Dalton).mp3';
const fftSmoothing = 0.1; // (0, 1)
const fftBands = Math.pow(2, 12); // 2^n
const logFactor = 1.1;
const startingValue = 4;
const powerIndex = 0.8
const brightnessConstant = 4/3;
const lerpVal = 0.66;
const bottomPowerIndex = 7.5;

const numLeds = 20;

var amp1 = 0; 
var amp2 = 0;
var amp3 = 0;
var amp4 = 0;
var amp5 = 0;


let strip, cnv, rgb = 'rgb(0,0,0)';

function preload() {
  song = loadSound(songName);
  loadBoard();
}

const wait = async (milliseconds) => {
  await new Promise(resolve => {
      return setTimeout(resolve, milliseconds)
  });
};

function setup() { 
  p5.j5.events.on('boardReady', () => {
    console.log('setting up', p5.j5.board);
    strip = new p5.j5.nodePixel.Strip({
        board: p5.j5.board,
        controller: "FIRMATA",
        strips: [ {pin: 6, length: numLeds}, ], // this is preferred form for definition
        gamma: 0.9, // set to a gamma that works nicely for WS2812,
    });

    strip.on("ready", async function() {
      strip.color('#00ff00');
      strip.show();
      dynamicSet(30);
    });
  });

  cnv = createCanvas(100, 100);
  cnv.mouseClicked(() => {
    toggleSong();
  })
  fft = new p5.FFT(fftSmoothing, fftBands);
}

function keyPressed() {
  if (keyCode === LEFT_ARROW) {
    jumpSong(-5);
  } else if (keyCode === RIGHT_ARROW) {
    jumpSong(5);
  }
}

function jumpSong(value) {
  song.jump(song.currentTime() + value);
}


function fillColor(arr) {
  return 'rgb('.concat(arr[0]).concat(',')
                .concat(arr[1]).concat(',').concat(arr[2])
                .concat(')');
}

function toggleSong() {
  if (song.isPlaying()) {
    song.pause();
    // rgb = 'rgb(0,0,0)'

  }
  else {
    song.play();
    // rgb = 'rgb(255,255,255)'
  }
  // strip.color(rgb);
  // strip.show();

}


function makeRect(mult, powMult, data, h) {
  return new Array(Math.max(0, Math.floor(Math.min(data[0], brightnessConstant/brightnessConstant * mult * Math.pow(-h/400 * powMult, bottomPowerIndex) * data[0]))), 
      Math.max(0, Math.floor(Math.min(data[1], brightnessConstant/brightnessConstant * data[1] * mult * Math.pow(-h/400 * powMult, bottomPowerIndex)))),
      Math.max(0, Math.floor(Math.min(data[2], brightnessConstant/brightnessConstant * data[2] * mult * Math.pow(-h/400 * powMult, bottomPowerIndex)))));
}



function draw() { 
  background(fillColor(backgroundRGB));
  fill('rgb(255,255,255)');
  let spectrum = fft.analyze();
  text(song.currentTime(), 50, 50);
  fill('rgb(0,0,0)');


  amp1 = 0;
  amp2 = 0;
  amp3 = 0;
  amp4 = 0;
  amp5 = 0;

  const h3Multiplier = 1;
  const h4Multiplier = 1.5;
  const h5Mutliplier = 1.25;


  let count = 0;

  for (let i = startingValue; i < spectrum.length; i = logFactor * i) {
    let h =  min(0, -canvasHeight + 1/powerIndex * 256 * Math.pow(map(spectrum[Math.ceil(i)], 0, 256, canvasHeight, 0)/256, powerIndex)); // idk why 256
  
  data = projectCTX.getImageData( 
    Math.min(colorSpectrumWidth - 1, Math.floor((count + 1) * (2/3) * colorSpectrumWidth/(fftBands/(Math.log2(spectrum.length)/Math.log2(logFactor))))), 0, 2000, 1600).data;

    var temp = new Array(0, 0, 0);

    if (i < 18) {
      temp = makeRect(1, 1, data, h);
      // fill(fillColor(new Array(temp[0], temp[1], temp[2])));  
      // rect(count * canvasWidth / (Math.log2(spectrum.length)/Math.log2(logFactor)), canvasHeight + 1000, canvasWidth / (Math.log2(spectrum.length)/Math.log2(logFactor)), -400)
    }
    else if (i < 50) {
      temp = makeRect(1,1,  data, h);
      // fill(fillColor(new Array(temp[0], temp[1], temp[2])));  
      // rect(count * canvasWidth / (Math.log2(spectrum.length)/Math.log2(logFactor)), canvasHeight + 1000, canvasWidth / (Math.log2(spectrum.length)/Math.log2(logFactor)), -400)
    }
    else if (i < 125) {
      temp = makeRect(h3Multiplier, 1, data, h);
      // fill(fillColor(new Array(temp[0], temp[1], temp[2])));  
      // rect(count * canvasWidth / (Math.log2(spectrum.length)/Math.log2(logFactor)), canvasHeight + 1000, canvasWidth / (Math.log2(spectrum.length)/Math.log2(logFactor)), -400);
    }
    else if (i < 1000) {
      temp = makeRect(h4Multiplier, 1, data, h);
      // fill(fillColor(new Array(temp[0], temp[1], temp[2])));  
      // rect(count * canvasWidth / (Math.log2(spectrum.length)/Math.log2(logFactor)), canvasHeight + 1000, canvasWidth / (Math.log2(spectrum.length)/Math.log2(logFactor)), -400)
    }
    else if (i < 4096) {
      temp = makeRect(1, h5Mutliplier, data, h);
      // fill(fillColor(new Array(temp[0], temp[1], temp[2])));  
      // rect(count * canvasWidth / (Math.log2(spectrum.length)/Math.log2(logFactor)), canvasHeight + 1000, canvasWidth / (Math.log2(spectrum.length)/Math.log2(logFactor)), -400)

    }


  // fill(fillColor(new Array(data[0], data[1], data[2])));
  colorMap.set(Math.floor(numLeds * count / 73), fillColor(new Array(temp[0], temp[1], temp[2])));
  // strip.pixel(Math.floor(pxNum)).color(ledClr);
  // strip.pixel(Math.floor(count / 2)).color('rgb(255, 255, 255)');

  // rect(count * canvasWidth / (Math.log2(spectrum.length)/Math.log2(logFactor)), canvasHeight, canvasWidth / (Math.log2(spectrum.length)/Math.log2(logFactor)), h)
  count+=1;

    }
}


function getRGB() {
  const img = document.querySelector('#example'); 
  const canvas = document.createElement('canvas'); 
  canvas.width = img.width;
  canvas.height = img.height;
  var ctx = canvas.getContext('2d'); 

  colorSpectrumWidth = img.width;
  
  ctx.drawImage(img, 0, 0)

  projectCTX = ctx;
}

async function dynamicSet( delay ){
  var foo = setInterval(async function(){
      for(var i = 0; i < numLeds; i++) {
          await strip.pixel(i).color(colorMap.get(i));
      }
      await strip.show();
  }, 1000/delay);
}