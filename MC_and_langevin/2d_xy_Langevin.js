// Standard Normal variate using Box-Muller transform.
// taken form https://stackoverflow.com/a/36481059
function randn_bm() {
     "use strict";
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

var randn = randn_bm;

function rand() {
    return Math.random();
}

function randi(N) {
    return Math.floor(Math.random()*N);
}

function wrap(x, N) {
     "use strict";
    while (x<0)
        x+=N;
    while(x>=N)
        x-=N;
    return x;
}

function dot(x, y){
     "use strict";
    return numeric.dot(x,y);
}

function cross(x,y) {
     "use strict";
    return [x[1]*y[2]-x[2]*y[1], x[2]*y[0]-x[0]*y[2], x[0]*y[1]-x[1]*y[0]];
}

function ind2ind(x, y) {
    "use strict";
    return wrap(x,N)+N*wrap(y,N);
}
function at(lattice, x){
    "use strict";
    return lattice[ind2ind(x[0],x[1])];
}

var neighbours = [[1,0], [0,1], [-1,0], [0,-1]];


function energyAt(lattice, r) {
    var res = 0;
    var phiCenter = at(lattice, r)[0];
    neighbours.forEach(function (dr) {                
        var phiNeig = at(lattice, numeric.add(r, dr))[0];
        res += Math.cos(phiCenter-phiNeig);
    });
    return -res;
}

var debugFlag = false;
var debugInterruptFlag = false;
function step(T, h) {
    
    var dPhi = new Float32Array(N*N);
    neighbours.forEach(function (dr){
        for(var i=0; i<N; ++i)
            for(var j=0; j<N; ++j){
                var phi = at(structure, [i,j])[0];
                var phiN = at(structure, numeric.add([i,j], dr))[0];
                dPhi[i*N + j] +=  -Math.sin(phi - phiN);
            }
                
    });

    for(var i=0; i<N; ++i)
        for(var j=0; j<N; ++j)
            at(structure, [i,j])[0] += dPhi[i*N+j]*h + Math.sqrt(2*T*h)*randn(); 
            
}

function randomConfiguration(N) {
     "use strict";
    var res = [];
    for(var i=0; i<N*N; ++i)
        res.push([Math.random()*2*Math.PI]);
    
    return res;
}

function randomizeConfiguration() {
    "use strict";
    structure = randomConfiguration(N);
    drawSections();
}

function createSVGElement(elem,attributes) {
    "use strict";
    var ns = "http://www.w3.org/2000/svg";
    var c = document.createElementNS(ns,elem);
    for(var a in attributes)
        c.setAttributeNS(null,a,attributes[a]);
    return c;
}

function rad2deg(a){
    return 180*a/Math.PI;
}



function drawSections() {
    "use strict";
    drawSection([N/2, N/2], structureGxy);
}


function createDrawingRect(center) {
    var res = createSVGElement('g', {transform: `translate(${center[0]*1.9} ${center[1]*1.9}) scale(1.9,-1.9)`});
    res.appendChild(createSVGElement('rect', {x:"-150", y:"-150", width:"300", height:"300", 'fill':'white'}));
    res.appendChild(createSVGElement('g',{}));
    return res;
}



var structureSVG,
    structureGxy,
    orientationTextField;
var structure = [];

var N, scale,len;

function initialize() {
    N = Number(document.getElementById('NInp').value);
    scale = 28/2*10/N*2;
    len = 14*10/N*2
    
    structure = randomConfiguration(N);
    drawSections(0);
}


var optimizationRunning = false;
function runOptimizationVisual() {
    "use strict";
    
    if(optimizationRunning)
        return;
    
    optimizationRunning = true;
    
    var optimizationSteps = 0;
    
    var runOneStep = function () {
        var T = document.getElementById('T').value,
            Niter = document.getElementById('visualizeEveryInp').value,
            delay = document.getElementById('delayInp').value,
            h = document.getElementById('hInp').value;
            
        for(var i=0; i<Niter; ++i)
            step(T, h);
        
        drawSections();
        
        if (optimizationRunning)
            setTimeout(runOneStep, //keep running
                      delay);
    }
    
    runOneStep();
}

function stopOptimizationVisual() {
    "use strict";
    optimizationRunning = false;
}

var runAutomatically = true;
var delay = 100;
var m=1,
    e=-0.2;


window.onload = function(){
    "use strict";
    structureSVG = document.getElementById('structure');
    orientationTextField = document.getElementById('orientation');
    
    structureGxy = createDrawingRect([150,150]);
    structureSVG.appendChild(structureGxy);
    structureGxy = structureGxy.childNodes[1];
    
    initialize();
    
}
