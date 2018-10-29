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
    //NEED TO CHANGE THIS TO SOMETHING MORE REASONABLE
    //does not work with truecolor images
    var w=pixels.width;
    var h=pixels.height;
    var result = new complex_array.ComplexArray(w*h,Float32Array);
    for(var i = 0; i<w*h; i++)
        result.real[i]=255-pixels.data[4*i];

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




function falsecolor(data, saturation) {
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

function centeredFFT(data) {
    //Breaks the data!!!
    applyFFTShift(data);

    var imageFFT=fft.FFT2D(data,data.width,data.height,true);
    imageFFT.width=data.width;
    imageFFT.height=data.height;
    applyFFTShift(imageFFT);
    return imageFFT;
}

function fftContext(ctx_from,ctx_to,saturation,w,h) {
    w = w || ctx_from.canvas.width;
    h = h || ctx_from.canvas.width;

    var pixels = ctx_from.getImageData(0,0,w,h);
    var imageRed = extractRedChannel(pixels);
    //console.log(imageRed);

    var imageFFT = centeredFFT(imageRed);

    var imgData = falsecolor(imageFFT, saturation);
//debugger
    ctx_to.putImageData(imgData, 0, 0);
}

function fftImage(img_from, ctx_to, saturation) {
    var imageRed=getImageData(img_from);

    var imageFFT = centeredFFT(imageRed);

    var imgData = falsecolor(imageFFT,saturation);

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




//------------------------------------------------------------------------


function clear(ctx) {
    var w=ctx.canvas.width;
    var h=ctx.canvas.height;

    ctx.fillStyle='white';
    ctx.fillRect(0,0,w,h);
    ctx.fillStyle='black';
}

function drawSquare(ctx, r,s, x, y) {
    var w=ctx.canvas.width;
    var h=ctx.canvas.height;
    ctx.setTransform(1,0,0,1,0,0);


    ctx.translate(w/2+x,h/2+y);
    ctx.rotate(r);

    ctx.fillRect(-s/2,-s/2,s,s);
    ctx.setTransform(1,0,0,1,0,0);
}

function drawCircle(ctx, r, x, y) {
    var w=ctx.canvas.width;
    var h=ctx.canvas.height;

    ctx.beginPath();
    ctx.ellipse(w/2+x, h/2+y, r, r, 0, 0, 2 * Math.PI);
    ctx.fill();
    }

function drawTriangle(ctx,t) {
    fail();
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
