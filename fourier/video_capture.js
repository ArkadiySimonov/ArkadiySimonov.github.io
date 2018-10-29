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

// Control lightness with a number
// Black and white video maybe
// pause
// fft image (via drag-drop-resize?-crop)
// save
// abc game
// fuzzy duck, truncation error
// cut-projection
// the book writes a bunch of stuff for window functions, fancy ones
//question: why do not we use a fancy window function in reciprocal lattice to suppress 
//the truncation ripples????

// wrap-around

// linear
// translation
// convolution
// inversion
// moving, moving behind the rectangle
// gaussian imoprtant - page 39 pedestrians
// lorentzian?? lorentzian 3d?
// abc - add the stuff as pngs
//parseval equation
//rectangle
//integral in the centre is just the integral of all electron density
//HTMLMediaElement.srcObject

function setupCamera(videoCanvas, videoFFTCanvas) {
    
    var params = {
        saturation:20,
        pause:false,
        paused:false,
        restart:function(){}
    };
    
    function timerCallback() {
        if (video.paused || video.ended)
            return;
        if (params.pause) {
            params.paused=true;
            params.restart=function() {
                params.pause=false;//more elegantly here would be to remove timeout
                params.paused=false;
                params.restart=function(){};
                timerCallback();
            };
        }
        drawFrame(video, videoCanvas, videoFFTCanvas);
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

        //somehow pixelats everything, why is that???
        ctx.drawImage(video, dx,dy);
        var pixels = ctx.getImageData(0,0,w,h);
        var imageRed=extractRedChannel(pixels);
        var imageFFT = centeredFFT(imageRed);
        var imgData = falsecolor(imageFFT, params.saturation);

        videoFFTCanvas.getContext('2d').putImageData(imgData,0,0);

        //imageBW
        //fftImage(video, videoCanvas.getContext('2d'));
    //            console.log('works');
    //            console.log(videoCanvas);
    }
    
    
     video = document.createElement('video');//('FFTVideo');
//    document.getElementsByTagName('body')[0].appendChild(video); FOr debug
//    video.setAttribute('muted')//TODO: make sure these are allright

    video.addEventListener('play', 
                           timerCallback, 
                           false);
var sz=480; //
    sz=256;
    navigator.getUserMedia(
        {audio:false,
          video: {width: { ideal: sz }, 
                  height: { min: sz }, 
                  facingMode:  "environment" }},

        function(stream) {
            video.src = URL.createObjectURL(stream);
            video.play();
        },
        function (error) {
            alert(JSON.stringify(error, null, '\t'));
        });

    console.log('Setting up the video...');
    return params;
}