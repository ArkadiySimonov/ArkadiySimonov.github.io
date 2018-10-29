"use strict";
function ang(real, imag) {
    return Math.atan2(imag, real);
}

function abs(real, imag) {
    return Math.sqrt(real*real+imag*imag);
}

function complex2color(real,imag,saturation) {
    var phi = ang(real,imag);
    var val = abs(real,imag)/saturation;
    if(val>1)
        val=1;

    var col = HUSL.p.toRGB(phi/Math.PI*180,val*100,100-30*val);
    var col = HUSL.toRGB(phi/Math.PI*180,val*100,100-30*val);
    //var col = HUSL.p.toRGB(phi/Math.PI*180,val*100,100-100*val);
    //var col = HUSL.p.toRGB(phi/Math.PI*180,val*100,70*val);
    return col;
}

function extractRedChannel(pixels) {
    var w=pixels.width;
    var h=pixels.height;
    var result = new complex_array.ComplexArray(w*h,Float32Array);
    for(var i = 0; i<w*h; i++)
        result.real[i]=pixels.data[4*i];

    result.width=w;
    result.height=h;
    return result;
}



function getImageData(img) {
    var w=img.width;
    var h=img.height;

    if(w % 2 === 1) //cut the last row/lasc column
        w-=1;
    if(h % 2 === 1)
        h-=1;

    var canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    // Copy the image contents to the canvas
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    var pixels = ctx.getImageData(0,0,w,h);

    return extractRedChannel(pixels);
}

function applyFFTShift(data) {
    if(data.width % 2 != 0 || data.height % 2 !=0)
        throw "data has uneven dimensions";


    var w=data.width;
    var h=data.height;
    var dsets=[data.real,data.imag];
    for(var di=0; di<2; ++di) {
        var dataset=dsets[di];
        for(var i=0, si = w/2; i<w; ++i, ++si) {
            if(si===w)
                si=0;

            for(var j=0; j<h/2; ++j) {
                var t=dataset[j*w+i];
                dataset[j*w+i]=dataset[(j+h/2)*w+si];
                dataset[(j+h/2)*w+si]=t;
            }
            }
    }
}

function pseudocolor(data, saturation) {
    saturation = saturation || 70;
    //Выгрузка данных в картинку
    var imgData=new ImageData(data.width,data.height);

    for(var i=0;i<data.width*data.height; ++i)
    {
        var pixelColor = complex2color(data.real[i],data.imag[i],saturation);

        for(var c=0;c<3;++c)
            imgData.data[i*4+c]=pixelColor[c]*255;

        imgData.data[i*4+3]=255; //alpha
    }
    return imgData;
}

function centeredFFT(data) {
    //Breaks the data!!!
    applyFFTShift(data);

    var imageFFT=fft.FFT2D(data,data.width,data.height,true);
    imageFFT.width=data.width;
    imageFFT.height=data.height;
    applyFFTShift(imageFFT);
    return imageFFT;
}

function fftContext(ctx_from,ctx_to,w,h, saturation) {
    var pixels = ctx_from.getImageData(0,0,w,h);
    var imageRed = extractRedChannel(pixels);

    var imageFFT = centeredFFT(imageRed);

    var imgData = pseudocolor(imageFFT, saturation);

    ctx_to.putImageData(imgData,0,0);
}

function fftImage(img_from, ctx_to, saturation) {
    var imageRed=getImageData(img_from);

    var imageFFT = centeredFFT(imageRed);

    var imgData = pseudocolor(imageFFT,saturation);

    ctx_to.putImageData(imgData,0,0);
}

function truncateUneven(s) {
    if(s%2 == 1)
        s-=1;
    return s;
}

function replaceImgWithFFT(img) {
    var fftDiv = document.createElement('div');
    img.parentNode.replaceChild(fftDiv,img);
    fftDiv.appendChild(img);
    var cnv = document.createElement('canvas');
    cnv.width=truncateUneven(img.width);
    cnv.height=truncateUneven(img.height);
    fftDiv.appendChild(cnv);
    var ctx=cnv.getContext('2d');

    fftImage(img, ctx);
}

function performFFTsToRequestingImages() {
    var targets = document.getElementsByClassName('fft');
    for(var i=0; i<targets.length; ++i)
        replaceImgWithFFT(targets[i]);            

}

navigator.getUserMedia = 
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;

window.URL = 
    window.URL ||
    window.webkitURL ||
    window.mozURL ||
    window.msURL;

var video;
var videoCanvas;
var videoFFTCanvas;
function timerCallback() {
    if (video.paused || video.ended)
        return;
    drawFrame();
    setTimeout(function() {
        timerCallback();
    }, 50);
}


function drawFrame() {
    var w=videoCanvas.width;
    var h=videoCanvas.height;

    // Copy the image contents to the canvas
    var ctx = videoCanvas.getContext("2d");
    var dx = -(video.videoWidth  - w)/2;
    var dy = -(video.videoHeight - h)/2;

    ctx.drawImage(video, dx,dy);
    var pixels = ctx.getImageData(0,0,w,h);
    var imageRed=extractRedChannel(pixels);
    var imageFFT = centeredFFT(imageRed);
    var imgData = pseudocolor(imageFFT);

    videoFFTCanvas.getContext('2d').putImageData(imgData,0,0);

    //imageBW
    //fftImage(video, videoCanvas.getContext('2d'));
//            console.log('works');
//            console.log(videoCanvas);
}

function setupCamera() {
    video = document.createElement('video');//('FFTVideo');
    videoCanvas = document.getElementById('VideoCanvas');
    videoFFTCanvas = document.getElementById('FFTVideoCanvas');

    video.addEventListener('play', timerCallback, false);

    navigator.getUserMedia(
        {video:true, audio:false},
        function(stream) {
            video.src = URL.createObjectURL(stream);
            video.play();
        },
        function (error) {
            alert(JSON.stringify(error, null, '\t'));
        });

    console.log('tried to do something');
}

//I need gifs: vibrating cube lr, oscillating cube clock wise-ccw, increasing-decreasing circle and the gif of the FFT 
//because my ffts at the moment are horrificly slow I need to precompute the shit
// Color inversion black to white, white-to-black; Inversion of triangle

// I need an interactive thing to recolor the source depending on which frequency we are talknig about. At least one of those
// to show how FFT works again.


// Lattice of a certain size - sincs around each lattice point
// Images for convolution - triangles times lattice (the triangle will be flipped)

// Gif with window function (how it works, why it is useful)

// Example white and black circles, linear correlations. Show presence/absence of phases for braggs/diffuse
// Say Bragg peaks contain information about the average strucutre. Should I show gray circles instead and show that they show exactly the fourier transform???

// PDF how it is constructed from three points. From four points.

// Patterson function - about the historical significance

// Delta PDF. How does this work

// THree correlations in delta PDF.



//It would have been cool to have a gif for 
//FFT camera - two versions. One would allow to freely see a portion of screen from camera and then on clicking a button to 
//save the result and calcualte FFT
//Another one which would choppily calculate FFT as you go and on pressing button save it. 
//
//FFT applet requires buttons for color saturation, choice of the version of coloring. Later possibly save and zoom and pan
//The left part later will possibly require windowing functions. apart form that this is it

//I need a certain way to quickly create 




function createGif1() {
    var gif = new GIF({
      workers: 1,
      quality: 10,
        width: 128*3,
        height:128*3
    });

    var playCNV=document.getElementById('forGif');
    var ctx=playCNV.getContext('2d');
    var middle=playCNV.width/2;
    var ctxFFT = document.getElementById('forGifFFT').getContext('2d');

    function drawSquare(r,s) {
      ctx.setTransform(1,0,0,1,0,0);
      ctx.fillStyle='white';
      ctx.fillRect(0,0,playCNV.width,playCNV.height)
      ctx.fillStyle='black';

      ctx.translate(middle,middle);
      ctx.rotate(r);
      ctx.fillRect(-s/2,-s/2,s,s);
      ctx.setTransform(1,0,0,1,0,0);
    }

    for(var r=0; r<1; r+=0.1) {
        drawSquare(Math.sin(r*Math.PI*2),40);
        gif.addFrame(ctx, {copy: true});  
    }

    // add an image element
    //gif.addFrame(imageElement);

    // or a canvas element
    //gif.addFrame(canvasElement, {delay: 200});

    // or copy the pixels from a canvas context
    //gif.addFrame(ctx, {copy: true});

    gif.on('finished', function(blob) {
      window.open(URL.createObjectURL(blob));
    });

    gif.render();

    //var int = setInterval(rotateAndDraw,50);
            //clearInterval(int);
    var r=0;
//        function rotateAndDraw() {
//          r+=0.04;
//          drawSquare(0,50+Math.sin(r)*20);
//        }

//        function rotateAndDraw() {
//            r+=0.01;
//            drawSquare(Math.sin(r*Math.PI*2),40);
//            fftContext(ctx,ctxFFT,playCNV.width,playCNV.height);
//            //if(r>0.1)
//            //    clearInterval(int);
//        }    


}

function clear(ctx) {
    var w=ctx.canvas.width;
    var h=ctx.canvas.height;

    ctx.fillStyle='white';
    ctx.fillRect(0,0,w,h);
    ctx.fillStyle='black';
}

function drawSquare(ctx, r,s, x, y) {
      ctx.setTransform(1,0,0,1,0,0);


      ctx.translate(w/2+x,h/2+y);
      ctx.rotate(r);

      //ctx.shadowBlur=5;
    //    ctx.shadowColor='black';

      ctx.fillRect(-s/2,-s/2,s,s);

      //  ctx.shadowBlur=0;

      ctx.setTransform(1,0,0,1,0,0);
    }

function drawCircle(ctx, r, x, y) {
    var w=ctx.canvas.width;
    var h=ctx.canvas.height;

    ctx.beginPath();
    ctx.ellipse(w/2+x, h/2+y, r, r, 0, 0, 2 * Math.PI);
    ctx.fill();
    }

function createGif() {
    var images=[];
    var imagesFFT=[];

    var playCNV=document.getElementById('forGif');
    var ctx=playCNV.getContext('2d');
    var middle=playCNV.width/2;
    var ctxFFT = document.getElementById('forGifFFT').getContext('2d');

    for(var r=0.0; r<1; r+=0.01) {
        clear(ctx);
        drawSquare(ctx, Math.sin(r*Math.PI*2), 40,0,0);
        images.push(ctx.canvas.toDataURL('image/png'));
        fftContext(ctx,ctxFFT,playCNV.width,playCNV.height);
        imagesFFT.push(ctxFFT.canvas.toDataURL('image/png'));
    }

    var imagesArr = [images,imagesFFT];
    for(var i=0; i<2; ++i)
       gifshot.createGIF({
                'images': imagesArr[i],
                'gifWidth': 128*3,
                'gifHeight': 128*3,
                'interval': 0.05
            },function(obj) {
                if(!obj.error) {
                    var image = obj.image,
                    animatedImage = document.createElement('img');
                    animatedImage.src = image;
                    document.body.appendChild(animatedImage);
                }
            });
    console.log('ready');
}

function renderGif(drawingFunction, saturation) {
    var images=[];
    var imagesFFT=[];

    var playCNV=document.getElementById('forGif');
    var ctx=playCNV.getContext('2d');
    var middle=playCNV.width/2;
    var ctxFFT = document.getElementById('forGifFFT').getContext('2d');

    for(var r=0.0; r<1; r+=0.01) {
        drawingFunction(ctx, r);
        images.push(ctx.canvas.toDataURL('image/png'));
        fftContext(ctx,ctxFFT,playCNV.width,playCNV.height, saturation);
        imagesFFT.push(ctxFFT.canvas.toDataURL('image/png'));

    }

    var imagesArr = [images,imagesFFT];
    for(var i=0; i<2; ++i)
       gifshot.createGIF({
                'images': imagesArr[i],
                'gifWidth': 128*3,
                'gifHeight': 128*3,
                'interval': 0.05, //
           'sampleInterval': 10
            },function(obj) {
                if(!obj.error) {
                    var image = obj.image,
                    animatedImage = document.createElement('img');
                    animatedImage.src = image;
                    document.body.appendChild(animatedImage);
                }
            });
    console.log('ready');
}

function oscillatingSquare(ctx,t) {
    clear(ctx);
    drawSquare(ctx, 0, 40,Math.round(10*Math.sin(t*Math.PI*2)),0);
}

function oscillatingPoint(ctx,t) {
    clear(ctx);
    drawSquare(ctx, 0, 2,Math.round(20*Math.sin(t*Math.PI*2)),0);
}

function sizeCircle(ctx,t) {
    clear(ctx);
    drawCircle(ctx,20+7*Math.sin(t*Math.PI*2),0,0);
}

function triangle(ctx,t) {
    clear(ctx);

    var a=20;
    var inv=0;
    if(t<0.5)
        inv=-1;
    else
        inv=1;

    var w=ctx.canvas.width;
    var h=ctx.canvas.height;

    var ang=-Math.PI/6;
    var da=-Math.PI*2/3;

    var cos=Math.cos;
    var sin=Math.sin;


    ctx.fillStyle='black';
    ctx.beginPath();
    ctx.moveTo(w/2+inv*a*cos(ang), h/2+inv*a*sin(ang));
    ctx.lineTo(w/2+inv*a*cos(ang+da), h/2+inv*a*sin(ang+da));
    ctx.lineTo(w/2+inv*a*cos(ang+da*2), h/2+inv*a*sin(ang+da*2));
    ctx.closePath();
    ctx.fill();
}

function testGif(drawingFunction) {

    var playCNV=document.getElementById('forGif');
    var ctx=playCNV.getContext('2d');
    var middle=playCNV.width/2;
    var ctxFFT = document.getElementById('forGifFFT').getContext('2d');

    var t=0;
    function incrementAndDraw() {
        drawingFunction(ctx,t);
        t+=0.01;
    }
    setInterval(incrementAndDraw,50);

}


window.onload = function() {
    //setupCamera(); //actually works ok. just copy a bigger portion of the camera and this is already useful
//            var cnv = document.getElementById('rainbow');
//            var ctx=cnv.getContext('2d');
//            
//            var img=document.getElementById('img');
//            fftImage(img,ctx);            
    performFFTsToRequestingImages();
  //  createGif();
  //  testGif(triangle);
    //renderGif(triangle,70);
    //renderGif(oscillatingPoint,70/20/20);
};