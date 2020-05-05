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

//function calculateEnergy(lattice, m, e) {
//    "use strict";
//    
//    function energyAt(lattice, r, m, e) {
//        var res = 0;
//        
//        var Sr = at(lattice, r);
//        var Srz = Sr[2];
//        
//        neighbours.forEach(function (dx) {
//            
//            var Srdx = at(lattice, numeric.add(r, dx));
//            var dotSS = dot(Sr, Srdx);
//            var mix = dot(Sr, cross(Srdx, dx));
//            
//            res = res - (dotSS*dotSS+m*dotSS*mix)/2; //2 for double counting neighbour interactions
//        });
//        
//        res = res - e*Srz*Srz;
//        
//        return res;
//    }
//    
//    var totalEnergy = 0;
//    for(var x=0; x<N; ++x)
//        for(var y=0; y<N; ++y)
//            for (var z=0; z<N; ++z)
//                totalEnergy = totalEnergy + energyAt(lattice, [x,y,z], m, e);
//    
//    return totalEnergy;
//}
//
//function latticeStep(lattice, m, e) {
//    "use strict";
//    var res = [];
//    for(var x=0; x<N; ++x)
//        for(var y=0; y<N; ++y){
//            var r = [x,y];
//            var dSr = [0, 0];
//            var Sr = at(lattice, r);
//            var Srz = Sr[2];
//
//            neighbours.forEach(function (dx) {
//                //In case of xy magnet and only first neighbours
//                //should just be
//                //
//                
//                var Srdx = at(lattice, numeric.add(r, dx));
//
//                var dotSS = dot(Sr, Srdx);
//
//                var cr = cross(Srdx, dx);
//                var mix = dot(Sr, cr);
//
//                dSr = numeric.sub(dSr, numeric.mulVS(Srdx, 2*dotSS+m*mix));
//                dSr = numeric.sub(dSr, numeric.mulVS(cr, m*dotSS));
//
//            });
//
//            dSr = numeric.sub(dSr, numeric.mulVS([0,0,1], 2*e*Srz));
//            //dSr = numeric.sub(dSr, numeric.mulVS(Sr, dot(Sr, dSr)));
//            res.push(dSr);
//            }
//    return res;
//}
//
//function normalize(v) {
//    return numeric.mulVS(v, 1/numeric.norm2(v));
//}


//var debugFlag = false;
//var debugInterruptFlag = false;
//function step(eps, m, e, n) {
//    var s = latticeStep(structure, m, e);
//    
//    if(debugFlag)
//        var E_old = calculateEnergy(structure,m,e);
//    
//    
//    var dEexp = 0; //debug variable
//    for(var i=0; i<N*N; ++i) {
//        var dr = numeric.mulVS(s[i], -eps);
//
//        if(n>0) {
//            dr = numeric.add(dr, numeric.mulVS(randomVector(), n));
//        }
//
//        
//        var newval = numeric.add(structure[i], dr);
//        
//        if(debugFlag)
//            var old_s = numeric.mulVS(structure[i], 1); 
//        
//        structure[i] = normalize(newval);
//        
//        if(debugFlag){
//            var dEr = dot(s[i], numeric.sub(structure[i], old_s));
//            
//            dEexp += dEr;
//            if(debugInterruptFlag && dEr>0)
//                debugger;
//        }
//            
//    }
//    
//    if(debugFlag) {
//        var E_new = calculateEnergy(structure, m, e);
//        console.log(`dE ${E_new-E_old} expected ${dEexp}`);
//    }
//    
//}

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
function step(T, sigma) {
    for(var preventInfinite=0; preventInfinite<10000; preventInfinite++) {
        var r = [randi(N),randi(N)],
            phiOld = at(structure, r)[0],
            E_old = energyAt(structure, r);

        at(structure,r)[0] = phiOld + randn()*sigma;
        var E_new = energyAt(structure,r),
            dE = E_new - E_old;
        if(dE <= 0)
            return; //accept
        else if(rand() < Math.exp(-dE/T))
            return; //accept
        else
            at(structure,r)[0] = phiOld;
            continue; //reject, but repeat until accept something
    }
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

var animationCallback;


var optimizationRunning = false;
function runOptimizationVisual() {
    "use strict";
    optimizationRunning = true;
    
    var optimizationSteps = 0;
    
    var runOneStep = function () {
        var T = document.getElementById('T').value,
            Niter = document.getElementById('visualizeEveryInp').value,
            delay = document.getElementById('delayInp').value,
            sigma = document.getElementById('sigmaInp').value;
            
        
//        document.getElementById('optimizationSteps').innerHTML = `Optimization step ${optimizationSteps} E=${calculateEnergy(structure, m, e)}`;
//        optimizationSteps+=1;
        
        for(var i=0; i<Niter; ++i)
            step(T, sigma);
        
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
