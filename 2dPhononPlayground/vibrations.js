//would be cool to add some cute animation to atoms
//when they first appear on canvas
//and also when somebody does not move mouse for a long time
//and also cute little white circles on them

//need classes: atom, link, bond

function createSVGElement(elem, attributes) {
    "use strict";
    var ns = "http://www.w3.org/2000/svg",
        c = document.createElementNS(ns, elem);
    var a;
    for (a in attributes) {
        c.setAttributeNS(null, a, attributes[a]);
    }

    return c;
}

function updateSVGElement(elem, attributes) {
    "use strict";
    var a;
    for (a in attributes) {
        elem.setAttributeNS(null, a, attributes[a]);
    }
}

var atomDefaults = {'H': {color: 'gray',  r: 0.3, mass: 1},
                    'C': {color: '#969696', r: 0.5, mass: 12},
                    'N': {color: '#7f7ff4',  r: 0.5, mass: 14},
                    'O': {color: '#fa7a7a',   r: 0.5, mass: 16}};

//Again, there should be some transformation between atomic internal coordinates (preferrably in angstroems)
//and canvas coordinates (which are all in pixels)
//though atom radii in angstroems is ok
//vector lengths in angstroems is also fine
//however vector other dimensions in angstroems is ridiculous a bits

//let's say, canvas will be responsible for panning/zooming

var atomId = 0;
var Atom = function (x, y, type, options) {
    "use strict";

    options=options || {};
    this.x = x;
    this.y = y;
    this.type = type;
    this.r = options.r || atomDefaults[type].r;
    this.mass = options.mass || atomDefaults[type].mass;
    this.color = options.color || atomDefaults[type].color;

    this.representations = [];
    this.links = [];
    this.bonds = [];
    this.id = atomId;
    atomId++;
}

var Representation = function (parent, dom, onUpdate, onDelete) {
    "use strict";
    this.parent = parent;
    this.dom = dom;
    this.onUpdate = onUpdate;
    this.onDelete = onDelete || function(){};
    this.update();
}

Representation.prototype.update = function() {
    "use strict";
    this.onUpdate(this.parent, this.dom);
}

Representation.prototype.delete = function() {
    "use strict";
    //TODO: cleanup at parents
    this.onDelete(this.parent, this.dom);
}

function registerRepresentation(target, dom, onUpdate, onDelete) {
    "use strict";
    var representation = new Representation(target, dom, onUpdate, onDelete);
    target.representations.push(representation);
}

var atomSVG = function(atom){
    "use strict";
    var dom = createSVGElement('circle', {}); //on drag update target atom
    dom.generatingAtom=atom;
    var onUpdate = function(atom, cir) {
        updateSVGElement(cir, {'cx': atom.x,
                              'cy': atom.y,
                              'r': atom.r,
                              'fill':atom.color,
                              'stroke':'#6a6a6a',
                              'stroke-width':'.02'});
    };

    registerRepresentation(atom, dom, onUpdate);
    return dom;
}

function renumberAtoms() {}

function revealSolution() {
    //if close to the solution, reveal the solution

}

function link(atom1, atom2, order) {
    "use strict";

    order = order || 1;
    var g = createSVGElement('g');
    var line = createSVGElement('line',{'stroke-width':order===1 ? '0.1' : '0.3',
                                       stroke:'black'});
    g.appendChild(line);

    var line2;
    if(order===2){
        line2 = createSVGElement('line',{'stroke-width':'0.1',
                                        stroke:'white'});
        g.appendChild(line2);
    }

    var onUpdate = function() {
        updateSVGElement(line,{x1:atom1.x,
                              x2:atom2.x,
                              y1:atom1.y,
                              y2:atom2.y});
        if(order===2)
            updateSVGElement(line2,{x1:atom1.x,
                                      x2:atom2.x,
                                      y1:atom1.y,
                                      y2:atom2.y});
    }

    onUpdate();
    atom1.representations.push({update:onUpdate});
    atom2.representations.push({update:onUpdate});

    return g;
}


function addMat(i_start,j_start,target,mat){
    for(var i=0; i<mat.length; ++i)
        for(var j=0; j<mat[0].length; ++j) {
            target[i_start+i][j_start+j]+=mat[i][j];
        }
}

function addDerivative(at1,at2,mat,dynamicMatrix) {
    var n1=at1.id*2;
    var n2=at2.id*2;
    addMat(n1,n2,dynamicMatrix,mat);
    addMat(n2,n1,dynamicMatrix,numeric.transpose(mat));
    var negMat=numeric.neg(mat);
    addMat(n1,n1,dynamicMatrix,negMat);
    addMat(n2,n2,dynamicMatrix,negMat);
}

function vectorBetweenAtoms(at1,at2) {
    return [at2.x-at1.x,at2.y-at1.y];
}

function normalize(v) {
    return numeric.div(v,numeric.norm2(v));
}

function rot90(v) {
    return [v[1],-v[0]];
}

function zeros(a,b){
    var res=new Array(a);
    for(var i=0; i<a; ++i) {
        res[i]=new Array(b);
        res[i].fill(0);
    }
    return res;
}

function randomMat(a,b){
    var res=new Array(a);
    for(var i=0; i<a; ++i) {
        res[i]=new Array(b);
        for(var j=0; j<b; ++j)
            res[i][j]=Math.random();
    }
    return res;
}

function argsort(arr) {
    var args=new Array(arr.length);
    for(var i=0; i<arr.length; ++i)
        args[i]=i;
    args.sort(function (a,b) {
        return compareNumbers(arr[a],arr[b]);
    });
    return args;
}

function argmax(arr) {
    var resVal = arr[0];
    var resInd = 0;
    for(var i=1; i < arr.length; ++i) {
        if(arr[i] > resVal) {
            resInd = i;
            resVal = arr[i];
        }
    }
    return resInd;
}

function reshuffle(arr,order) {
    res=new Array(order.length);
    for(var i=0; i<order.length; ++i){
        res[i]=arr[order[i]];
    }
    return res;
}

function min2(mat) {
    var min1=function(v) {
        return Math.min(...v);
    }
    return min1(mat.map(min1));
}
function max2(mat) {
    var max1=function(v) {
        return Math.max(...v);
    }
    return max1(mat.map(max1));
}

function map2(mat,f) {
    return mat.map(function (v,ri) {
        return v.map(function (el,ci) {
            return f(el,ri,ci);
        });
    });
}

function forEach2(mat,f) {
    mat.forEach(function (v,ri) {
        v.forEach(function (el,ci) {
            f(el,ri,ci);
        });
    });
}

var Spring = function(atom1, atom2, k) {
    this.atom1 = atom1;
    this.atom2 = atom2;
    this.k = k;
}

Spring.prototype.addForce = function(dynamicMatrix) {
    var v=normalize(vectorBetweenAtoms(this.atom1, this.atom2));
    var derivative = numeric.mul(-this.k, numeric.tensor(v,v));
    addDerivative(this.atom1,this.atom2,derivative,dynamicMatrix);
}

var AngleSpring = function(at1, at2, at3, k) {
    this.atom1 = at1;
    this.atom2 = at2;
    this.atom3 = at3;
    this.k = k;
}

AngleSpring.prototype.addForce = function(dynamicMatrix) {
    var k = this.k;
    [[this.atom2,this.atom1],[this.atom2,this.atom3]].forEach(function ([at2,at1]){
        var v = vectorBetweenAtoms(at2, at1);
        var pnv = normalize(rot90(v));
        var vlen = numeric.norm2(v);

        var forceMatrix = numeric.mul(-k/vlen, numeric.tensor(pnv,pnv));

        addDerivative(at1, at2, forceMatrix, dynamicMatrix);
    });
}


function fillDynamicMatrix() {
    var nDegFreed = atomId*2;
    dynamicMatrix=zeros(nDegFreed, nDegFreed);
    interactions.forEach(function (interaction){
        interaction.addForce(dynamicMatrix);
    });

    var m_to_05 = [];
    atoms.forEach(function (atom){
        var t = Math.sqrt(atom.mass);
        m_to_05.push(t);
        m_to_05.push(t);
    });

    numeric.diveq(dynamicMatrix, numeric.tensor(m_to_05, m_to_05));
}

function posFromEvent(e) {
    return {x:e.layerX, y:e.layerY};
}

function registerDrag(target, onDrag) {
    target.addEventListener('mousedown', function(e)
                            {
        var pos = posFromEvent(e);

        var drag = function(e) {
            var newPos = posFromEvent(e);
            onDrag(newPos.x-pos.x, newPos.y-pos.y);
            pos = newPos;
        }

        var stop = function(e) {
            drag(e);
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stop);
        }

        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stop);
    });
}

function arrow(x, y, dx, dy, color, onLenChange) {
    var arr = createSVGElement('path');
    var g = createSVGElement('g');
    var dragTarget = createSVGElement('circle');
    g.appendChild(arr);
    if (onLenChange)
        g.appendChild(dragTarget);

    var updateArrow = function() {
        var m=0.06;
        var baseWidth=2*m;
        var ahLen=6*m;
        var ahWidth=6*m;

        var len=Math.sqrt(sq(dx)+sq(dy));

        var baseLen;
        if(len>ahLen)
            baseLen=len-ahLen;
        else{
            baseLen=0;
            ahWidth=ahWidth*len/ahLen; //decrease the size of the base,
            ahLen=len;
        }

        var ahStep=(ahWidth-baseWidth)/2;

        var arrowPath=`M0,0 l0,${baseWidth/2} l${baseLen},0 l0,${ahStep} l${ahLen},${-ahWidth/2} l${-ahLen},${-ahWidth/2} l0,${ahStep} l${-baseLen},0 l0,${baseWidth/2}`;

         var rotationAngle=Math.atan2(dy, dx)/Math.PI*180;

        updateSVGElement(arr, {d:arrowPath,
                               fill:color,
                               stroke:'none'});
        updateSVGElement(g, {transform:`translate(${x},${y}), rotate(${rotationAngle})`});

        updateSVGElement(dragTarget, {cx:len,
                                     cy:0,
                                     r:'0.4',
                                    fill:'rgba(0,0,0,0)'})

    }

   updateArrow();

    registerDrag(dragTarget, function(ddx, ddy) {
        dx+=ddx/scale;
        dy+=ddy/scale
        updateArrow();

        if(onLenChange)
            onLenChange(dx, dy);
    });

    return g;
}

function displacementArrow(at, v, lengthMult, color) {
    return arrow(at.x, at.y, at.x+v[0]*lengthMult, at.y+v[1]*lengthMult, color);
}

function addAnotherVector() {
    otherVectors.push(numeric.transpose(probe)[0]);
    //probe = numeric.mul(0,probe);
    updateMatrixRepresentation();
    updateForceArrows();
    updateProbeArrows();
}

function highlightVector(targ, n, color) {
    color = color || '#fdf1eb';
    return function(e) {
        targ.setAttribute('style',`background-color:${color};`);
    }
}
function unhighlightVector(targ, n) {
    return function(e) {
        targ.setAttribute('style','');
    }
}

function stopPropagation(e) {
    console.log('prevent?');
    e.stopPropagation();
}

function uploadVector(vn) {
    return function(e) {
        e.preventDefault();
        probe = numeric.transpose([otherVectors[vn]]);
        updateAll();
    }
}

function updateAll() {
    updateMatrixRepresentation();
    updateForceArrows();
    updateProbeArrows();
}

function removeVector(vn) {
    return function(e) {
        otherVectors = otherVectors.slice(0,vn).concat(otherVectors.slice(vn+1));
        updateAll();
    }
}

function perpendicularize(vn) {
    return function(e) {
        if(numeric.norm2(otherVectors[vn])>0) {
            probe = reject(numeric.transpose(probe)[0], otherVectors[vn]);
            probe = numeric.transpose([probe]);
            updateAll();
        }
    }
}

function updateMatrixRepresentation() {
    ['matrix','matrix2','matrix3'].forEach(function (id) {
        var matrixTarget = document.getElementById(id);
        updateMatrix(dynamicMatrix, matrixTarget);
    });

    if(otherVectors.length>0) {
        document.getElementById('foundVectors').classList = ['matrixEquation'];
        var otherVectorTarg = document.getElementById('probeOtherVectors');
        otherVectorTarg.innerHTML = '';
        otherVectors.forEach(function (v, vn) {
            var tab = document.createElement('table');
            updateTable(numeric.transpose([v]),
                        tab);
            otherVectorTarg.appendChild(tab);
            tab.addEventListener('mouseover', highlightVector(tab, vn));
            tab.addEventListener('click', uploadVector(vn));
            tab.addEventListener('mouseup',stopPropagation);
            tab.addEventListener('mouseout', unhighlightVector(tab, vn));
            tab.classList = ['savedVector'];
        });

        //buttons on top of vectors

        var buttonsTarg = document.getElementById('buttonsOverSavedVectors');
        buttonsTarg.innerHTML = '';
        otherVectors.forEach(function (v, vn) {
            var d = document.createElement('div');
            d.classList = ['buttonRow'];

            var buttonM = document.createElement('button');
            buttonM.textContent = '–';
            buttonM.addEventListener('click',removeVector(vn));
            d.appendChild(buttonM);

            var buttonP = document.createElement('button');
            buttonP.textContent = '⟂';
            buttonP.addEventListener('click',perpendicularize(vn));
            d.appendChild(buttonP);

            buttonsTarg.appendChild(d);
        });


        updateMatrix(numeric.dot(dynamicMatrix,numeric.transpose(otherVectors)),
                   document.getElementById('forcesOtherVectors'));

    }else {
        document.getElementById('foundVectors').classList = ['hidden'];
    }


    var vecTarget = document.getElementById('probe');
    updateTable(probe, vecTarget, 'background-color:#fdf1eb;');

    response = numeric.dot(dynamicMatrix, probe);
    response = numeric.mul(-1, response);
    var resTarget = document.getElementById('result');
    updateMatrix(response, resTarget, {style:'background-color:#ece6f7;',
                                       needsBorders:true});

    factors = numeric.div(response, probe);
    factors = map2(factors, function(el, ci, ri) {
        if(isFinite(el))
            if(el>100){
                return '(*∞)';
            }else if(el<-100){
                return '(*-∞)';
            }else
                return '(*' + truncate(el) + ')';
        else
            return '.';
    });
    var hintTarget = document.getElementById('hint');
    updateMatrix(factors, hintTarget, {needsBorders:false});
}

function updateForceArrows() {
    if(needToUpdateForces()) {
        forceArrowsTarget.innerHTML='';

        for(var i=0; i<atomId; ++i) {
            var a = arrow(atoms[i].x, atoms[i].y, response[i*2][0], response[i*2+1][0], '#9b66f0');
            forceArrowsTarget.appendChild(a);
        }
    }
}
function last(arr) {
    return arr[arr.length-1];
}
function normalise(v) {
    return numeric.div(v, numeric.norm2(v));
}

function project(v, targ) {
    var nt = normalise(targ);
    return numeric.mul(nt, numeric.dot(v, nt));
}

function reject(v, targ) {
    return numeric.sub(v, project(v,targ));
}

function orthogonalise(arr) {
    res = [arr[0]];
    for(var i=1; i<arr.length; ++i) {
        var candidate = normalise(arr[i]); //normalise
        for(var j=0; j<res.length; ++j)
            candidate = normalise(numeric.sub(candidate, project(candidate, res[j])));
        res.push(candidate);
    }
    return res;
}

function projectToSubspace(arr,subspace) {
    var res=numeric.mul(arr,0);
    subspace.forEach(function (basisV) {
        numeric.addeq(res,project(arr, basisV));
    });
    return res;
}

function snapToClosestSolution(proximity) {
    console.log('snap');
    proximity = proximity || -1;

    var candidate = normalise(numeric.transpose(probe)[0]);
    var candidateNorm = numeric.norm2(candidate);
    if(candidateNorm>0) {
        var t = numeric.eig(dynamicMatrix,N*N*4*8);
        var eigenvalues=t.lambda.x;
        var eigenvectors=numeric.transpose(t.E.x); //maybe need to transpose
        var ord = argsort(eigenvalues);
        eigenvalues = reshuffle(eigenvalues,ord);
        eigenvectors = reshuffle(eigenvectors,ord);

        var subspaceIndices = [0];
        var tol = 1e-10;
        for(var i=1; i < eigenvalues.length; ++i) {
            if(Math.abs(eigenvalues[i]-eigenvalues[last(subspaceIndices)])>tol)
                subspaceIndices.push(i);
        }
        subspaceIndices.push(eigenvalues.length);
        var subspaces = [];
        for(var i=0; i<subspaceIndices.length - 1; ++i) {
            subspaces.push(orthogonalise(eigenvectors.slice(subspaceIndices[i],subspaceIndices[i+1])));
        }

        var projections = subspaces.map(function (subspace) {
            return projectToSubspace(candidate, subspace);
        });

        //find closest
        var prjectionNorms = projections.map(function (v) { return numeric.norm2(v)});
        var maxProjectionN = argmax(prjectionNorms);

        var howFar = Math.abs(prjectionNorms[maxProjectionN]/candidateNorm);
        if(howFar > proximity) {
            var res = normalise(projections[maxProjectionN]);
            probe = numeric.transpose([res]);

            document.getElementById('liveUpdateForces').checked = true;
            updateAll();
        }else {
            console.log('this far ' + howFar);
            console.log(numeric.prettyPrint(prjectionNorms));
        }

    }
}

function needToUpdateForces() {
    return document.getElementById('liveUpdateForces').checked;
}

function freezeResponse() {
    if(needToUpdateForces())
        updateForceArrows();
}

function updateProbeArrows() {
    probeArrowsTarget.innerHTML = '';
    for(var i=0; i<atomId; ++i) {
        var updateProbe = function(i){
            return function(dx, dy) {
                probe[i*2][0]=dx;
                probe[i*2+1][0]=dy;
                updateMatrixRepresentation();
                updateForceArrows();
            };
        };
        var a = arrow(atoms[i].x, atoms[i].y, probe[i*2][0], probe[i*2+1][0], '#c34300', updateProbe(i));
        probeArrowsTarget.appendChild(a);
    }
}

function normaliseForces() {
    if(numeric.norm2(numeric.transpose(probe)[0])>0) {
        probe = numeric.transpose([normalise(numeric.transpose(probe)[0])]);
        updateMatrixRepresentation();
        updateForceArrows();
        updateProbeArrows();
    }

}

function diagonalise(){
    if(otherVectors.length>0) {
        document.getElementById('diagonalisedSection').classList = [];

        var matrixTarget = document.getElementById('U');
        updateMatrix(otherVectors, matrixTarget);

        var matrixTarget = document.getElementById('V');
        updateMatrix(numeric.transpose(otherVectors), matrixTarget);

        updateMatrix(numeric.dot(otherVectors,numeric.dot(dynamicMatrix,numeric.transpose(otherVectors))),
                    document.getElementById('diagonalisedMatrix'))

    }


}

function hideDiag() {
    document.getElementById('diagonalisedSection').classList = ['hidden'];
}

var atoms, interactions;
var structureDrawingG;
var dynamicMatrix, probe, response;
var scale=50;
var forceArrowsTarget, forceArrowsTarget;
var otherVectors=[];


function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}

function setupModel(text) {
    var inp = JSON.parse(text);

    atoms=[];
    var atomTable = {};
    for(var atName in inp['atoms']) {
        var at = new Atom(...inp['atoms'][atName]);
        atoms.push(at);
        atomTable[atName]=at;
    }

    var structureDrawingCanvas = document.getElementById('structure');

    structureDrawingG = createSVGElement('g', {transform: `translate(300,200) scale(${scale})`});
    structureDrawingCanvas.appendChild(structureDrawingG);

    inp['links'].forEach(function ([at1Name,at2Name,order]){
        structureDrawingG.appendChild(link(atomTable[at1Name],
                                           atomTable[at2Name],
                                           order));
    });

    atoms.forEach(function (atom) {
        structureDrawingG.appendChild(atomSVG(atom));
    });

    var [C,N1,N2,O]=atoms;
    interactions=inp['interactions'].map(function(arg) {
        if(arg[0]==='spring') {
            return new Spring(atomTable[arg[1]],
                              atomTable[arg[2]],
                              arg[3]);
        }else {
            return new AngleSpring(atomTable[arg[1]],
                                  atomTable[arg[2]],
                                  atomTable[arg[3]],
                                  arg[4]);
        }
    });

    fillDynamicMatrix();

    probe = zeros(atomId*2,1);
    updateMatrixRepresentation();

    forceArrowsTarget = createSVGElement('g');
    structureDrawingG.appendChild(forceArrowsTarget);

    probeArrowsTarget = createSVGElement('g');
    structureDrawingG.appendChild(probeArrowsTarget);
    updateForceArrows();
    updateProbeArrows();

    window.addEventListener('mouseup',function() {snapToClosestSolution(0.95)});

    //add color highlight when close to solution
    //diagonalize matrix, show how it works.


    //make different examples - two atoms, two atoms diagonally,
    //three atoms line
    //h2o
    //three atoms triangle
    //NH3
    //Urea
    //Urea with hydrogens
    //hexagon (like benzene)

    //package them in jsons
    //allow page to get those jsons
    //commit




    //make a winning sound when found
    //make the thing run and vibrate




    //lattice - make a dynamic matrix for crystal
    //does it work for standing waves?
    //colors for vector phases
    //Make a couple of examples - one atom, graphene?

    //add plots of eigenfunctions/eigenvectors?

    //figure out for 2d crystals
    //how to represent vectors there?
    //solve automatically - dispersion curves
    //movies
    //show how to actually diagonalise something


    //should I add hydrogens to urea??
}

window.onload=function() {

    var interactionsFileName = window.location.search.substr("?interactions=".length);
    readTextFile(interactionsFileName, setupModel);
}

//Atom SVG representation
//Atom coord line representation

//Ok, a funny thing is pair object-representations I will need to have for this project
//Atom for instance has two representation: a circle on canvas, and also
//a line in atomic coordinates
//and two lines in the matrix of



//link - single or double bond

//forces - spring (show as a line)
//forces - angle (show as an angle plus in a list of forces plus as a line in force matrix)

// matrix - matrix of dynamic forces
// matrix - vector of displacements -> vector of forcess
//




function compareNumbers(a, b) {
  return a - b;
}





//Generally I need to create atoms and bonds
//but in addition to acting bonds, I will need
//to create links - artificial stuff on which later I will add real bonds
//for displacements and most importantly angles

//Now todo is
//when needed from atoms and links create interactions
//figure out the effects of angle interactions (will probably nick it from the prev python scripts)
//draw arrows
//list all displacements
//
//after that
//fft projection
//and 2d sectioning along the proper directions
// I would estimate - 5 more hours

const N=12;
const unitCell=40;
const cirSZ=5;
const [sx,sy]=[30,30];
var links=[];
var rightLinks,downLinks;
var atoms=[];
var atomsPlane=[];
var bonds=[];
var linkColors=['#c1c1c1','black'];
var strongLinks=0;
var arrowPlaceholder;

function linkColor(link) {
    if(link.strong)
        return linkColors[1];
    else
        return linkColors[0];
}

var fig;
function tt() {
    ['degreeOfFreedom','eigenvectorN'].forEach(function (id){
        document.getElementById(id).max=N*N*2;
    })

    fig=document.getElementById('crystalStructure');

    var atomId=0;
    atomsPlane=new Array(N*N);
    for(var i=0; i<N; ++i) {
        var row=[];
        atoms.push(row);

        for(var j=0; j<N; ++j) {
            var x=i*unitCell+sx,y=j*unitCell+sy;

            var c=createSVGElement('circle',{'cx':x,
                                             'cy':y,
                                             'r':cirSZ,
                                             'fill':'#a1a1ff',
                                             'stroke':'none'});
            var atom={i:i,
                      j:j, x:x, y:y, representations:[c], links:[], bonds:[], derivatives:{}, id:atomId};
            atomsPlane[atomId]=atom;
            atomId++;
            row.push(atom);

            c.generatingAtom=atom;
            fig.appendChild(c);
        }
    }

    var createLink=function(i,j,di,dj){
        var at1=atoms[i][j];
        var at2=atoms[(i+di) % N][(j+dj) % N];
        var link={at1:at1,
                  at2:at2,
                  strong:Math.random()<=0.5,
                  representations:[]};
        at1.links.push(link);
        at2.links.push(link);
        links.push(link);


        var wrapping_link_len=unitCell*0.65;

        var x,y;
        if(i===N-1 && di===1) {
            x=[[at1.x,at1.x+wrapping_link_len],
               [at2.x,at2.x-wrapping_link_len]];
        }else {
            x=[[at1.x,at2.x]];
        }

        if(j===N-1 && dj===1) {
            y=[[at1.y,at1.y+wrapping_link_len],
               [at2.y,at2.y-wrapping_link_len]];
        }else {
            y=[[at1.y,at2.y]];
        }


        x.forEach(function ([x1,x2]) {
            y.forEach(function ([y1,y2]) {
                var r=Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
                var nx=(x2-x1)/r,ny=(y2-y1)/r;

                var dr=cirSZ+3;

                var g=createSVGElement('g',{});

                x1=x1+nx*dr;
                x2=x2-nx*dr;
                y1=y1+ny*dr;
                y2=y2-ny*dr;
                var l=createSVGElement('line',{x1:x1,
                                               x2:x2,
                                               y1:y1,
                                               y2:y2,
                                               stroke:linkColor(link),
                                              'stroke-width':2});
                g.addEventListener('mouseover',lineMouseOver);
                g.addEventListener('mouseout',lineMouseOut);
                g.addEventListener('click',lineMouseClick);


                var bondPadding=14;
                var padding= function (x1,x2) {
                    var t=Math.abs(x2-x1);
                    return t===0 ? [t+bondPadding*2,-bondPadding] : [t,0];
                }
                var [w,dx]=padding(x1,x2);
                var [h,dy]=padding(y1,y2);
                var r=createSVGElement('rect',{x:Math.min(x1,x2)+dx,
                                               y:Math.min(y1,y2)+dy,
                                               width:w,
                                               height:h,
                                               fill:'rgba(255,0,0,0.0)',
                                              stroke:'none'})

                g.appendChild(r);
                g.appendChild(l);

                g.generatingLink=link;
                link.representations.push(g);
                fig.appendChild(g);
            });
        });

        return link;
    }

    rightLinks=zeros(N,N);
    downLinks=zeros(N,N);
    for(var i=0; i<N; ++i) {
        for(var j=0; j<N; ++j) {
            rightLinks[i][j]=createLink(i,j,1,0);
            downLinks[i][j]=createLink(i,j,0,1);
        }
    }


    arrowPlaceholder = createSVGElement('g',{});
    fig.appendChild(arrowPlaceholder);

    refreshBondsAndCalculateEigenvectors();
}

function refreshBondsAndCalculateEigenvectors(){
    refreshBonds();
    calculateDynamicMatrix();
    calculateEigenvectors();
    calculateDispersionCurve();
    draweigenvector();
}

function sq(x) {
    return x*x;
}



function drawArrows(row,lengthMult) {
    if(arrowPlaceholder.hasChildNodes()){
        arrowPlaceholder.removeChild(arrowPlaceholder.firstChild);
    }

    var g=createSVGElement('g',{});
    for(var i=0; i<atomsPlane.length; ++i) {
        g.appendChild(displacementArrow(atomsPlane[i],row.slice(i*2,i*2+2),lengthMult));
    }
    arrowPlaceholder.appendChild(g);
}

function drawDegreeOfFreedom(e) {
    var degreeOfFreedom=Number(document.getElementById('degreeOfFreedom').value)-1;
    drawArrows(dynamicMatrix[degreeOfFreedom],30);
}

function draweigenvector(e) {
    var eigenvectorN=Number(document.getElementById('eigenvectorN').value)-1;
    drawArrows(eigenvectors[eigenvectorN],30*5);

    var t = fftProjectMode(eigenvectors[eigenvectorN]);

    extractTri(t);

    t = mat2svg(fillBorder(t),{border:'solid',borderColour:'aliceblue'});
    var targ=document.getElementById('ftDiv');
    if(targ.hasChildNodes())
        targ.removeChild(targ.childNodes[0]);
    targ.appendChild(t);

    moveMarker(eigenvalues[eigenvectorN]);
}



function readForceConstants() {
    var res={};
    var bonds=
    ['weakBond','strongBond',
     'weakSmallAngle','mediumSmallAngle','strongSmallAngle',
     'weakLargeAngle','mediumLargeAngle','strongLargeAngle'];
    bonds.forEach(function (bond){
        res[bond]=Number(document.getElementById(bond).value);
    });
    return res;
}

function getOther(first,coll){
    for(var i=0; i<coll.length; ++i) {
        if(coll[i]!==first)
            return coll[i];
    }
}

function refreshBonds() {
//    clear bonds in atoms
//    atoms.forEach(function (row) {
//        row.forEach(function (atom){
//            atom.derivatives={};
//            bonds=[];
//        });
//    });

    var forceConstants=readForceConstants();
    bonds=[];
    //links is easy: for each link create a spring bond
    links.forEach(function (link) {
        var bond={type:'spring', link:link, at1:link.at1, at2:link.at2, k:link.strong ? forceConstants['strongBond'] : forceConstants['weakBond']};
        bonds.push(bond);
        //register bond with atom
//        [link.at1,link.at2].forEach(function (at){
//            at.bonds.push(bond);
//        })
    });

    //angles are a bit trickier. For each atom create a list of links. For each pair in the list figure out which
    //of six links should be applied
    atoms.forEach(function (row){
        row.forEach(function (atom) {
            var at2=atom;

            var links=atom.links;
            for(var i=0; i<links.length; ++i)
                for(var j=i+1; j<links.length; ++j) {
                    //get other two atoms
                    var l1_2=[links[i],links[j]];

                    var [at1,at3]=l1_2.map(function(l) {
                        return getOther(at2,[l.at1,l.at2]);
                    });

                    //figure out which force constant to use
                    var strnegths=l1_2.map(function(link){
                        return link.strong ? 1 : 0;
                    });
                    var linkStrength=strnegths[0]+strnegths[1];

                    //figure out if it is a straight or bent angle
                    var vectors=l1_2.map(function (link){
                        return vectorBetweenAtoms(link.at2,link.at1);
                    });
                    var angleIsBent=false;
                    if((vectors[0][0]*vectors[1][0]+vectors[0][1]*vectors[1][1])===0)
                        angleIsBent=true;

                    var forceConstant;
                    if(angleIsBent){
                        const dict={0:'weakSmallAngle',1:'mediumSmallAngle',2:'strongSmallAngle'};
                        forceConstant=forceConstants[dict[linkStrength]];
                    } else{
                        const dict={0:'weakLargeAngle',1:'mediumLargeAngle',2:'strongLargeAngle'};
                        forceConstant=forceConstants[dict[linkStrength]];
                    }

                    bonds.push({type:'angle', at1:at1, at2:at2, at3:at3, k:forceConstant});
//                    [at1,at2,at3].forEach(function (atom) {
//                        atom
//                    })

                }

        });
    });
}



var dynamicMatrix;
function calculateDynamicMatrix() {
    var nDegreesOfFreedom=atomsPlane.length*2;
    dynamicMatrix=new Array(nDegreesOfFreedom);
    for(var i=0; i<nDegreesOfFreedom; ++i){
        var row=new Array(nDegreesOfFreedom);
        row.fill(0);
        dynamicMatrix[i]=row;
    }

    bonds.forEach(function (bond){
        if(bond.type==="spring") {
            var v=normalize(vectorBetweenAtoms(bond.at1,bond.at2));
            var derivative = numeric.mul(-bond.k, numeric.tensor(v,v));
            addDerivative(bond.at1,bond.at2,derivative,dynamicMatrix);
        }else if(bond.type==="angle"){
            [[bond.at2,bond.at1],[bond.at2,bond.at3]].forEach(function ([at2,at1]){
                var v=vectorBetweenAtoms(at2,at1);
                var pnv=normalize(rot90(v));
                var vlen=numeric.norm2(v);

                var forceMatrix=numeric.mul(-bond.k/vlen,numeric.tensor(pnv,pnv));

                addDerivative(at1,at2,forceMatrix,dynamicMatrix);
            });
        }
    });

}



var eigenvalues,eigenvectors;
var marker;
function moveMarker(e) {
    var t=e/marker.maxE;
    var y=marker.ymax*t+(1-t)*marker.ymin;
    marker.elem.setAttributeNS(null,'y',y)
}

function calculateDispersionCurve() {
    var targ=document.getElementById('dispersionCurveDiv');

    if(targ.hasChildNodes()){
        targ.removeChild(targ.firstChild);
    }

    var vert=30;
    var maxE=6;
    var h = histDispersionCurves(eigenvalues, eigenvectors,vert,maxE);
    h.reverse();

    var widths=new Array(h[0].length);
    var wid=10;
    var height=wid/15*15;
    widths.fill(wid);
    for(var i=Math.round((widths.length-1)*2/3); i<widths.length; ++i) {
        widths[i]=wid*Math.sqrt(2);
    }

    var heights=new Array(vert);
    heights.fill(height);
    var padding=25;
    var drawing=mat2svg(h,{paddingx:padding,paddingy:padding,border:'none',widths:widths,heights:heights});
    var cw=Number(drawing.getAttributeNS(null,'width'));
    var ch=Number(drawing.getAttributeNS(null,'height'));
    drawing.appendChild(createSVGElement('rect', {x:padding,
                                            y:padding,
                                            width:cw-padding*2,
                                            height:ch-padding*2,
                                            fill:`none`,
                                            stroke:'#b5b5b5'}));


    var d=15;
    var dd=3;
    var t=createSVGElement('text',{x:padding-d,y:ch-padding+20});
    t.innerHTML='(0,0)';
    drawing.appendChild(t);


    t=createSVGElement('text',{x:padding-d-dd+wid*N/2,y:ch-padding+20});
    t.innerHTML='(0.5,0)';
    drawing.appendChild(t);

    t=createSVGElement('text',{x:padding-d-dd*2+2*wid*N/2,y:ch-padding+20});
    t.innerHTML='(0.5,0.5)';
    drawing.appendChild(t);

    t=createSVGElement('text',{x:cw-padding-d,y:ch-padding+20});
    t.innerHTML='(0,0)';
    drawing.appendChild(t);

    marker={elem:createSVGElement('rect',{x:cw-padding+5,
                                          y:padding,
                                          width:15,
                                         height:1,
                                         fill:'none',
                                         stroke:'gray'}),
           maxE:maxE,
           ymax:padding,
           ymin:ch-padding};

    drawing.appendChild(marker.elem);

    targ.appendChild(drawing);
}



function fftshift_v(v) {
    var l=v.length;
    return v.slice(l/2).concat(v.slice(0,l/2));
}

function fftshift(mat){
    return fftshift_v(mat.map(fftshift_v));
}

function fftshiftT(T){
    return new numeric.T(fftshift(T.x),fftshift(T.y));
}

function fft2d(mat) {
    var sz1=mat.length;
    var sz2=mat[0].length;
    var [real,imag]=[0,1].map(function (_) {return new Array(sz1);});
    var zeros=new Array(sz2);
    zeros.fill(0);
    for(var i=0; i<sz1; ++i) {
        var t=(new numeric.T(mat[i],zeros)).fft();
        real[i]=t.x;
        imag[i]=t.y;
    }
    real=numeric.transpose(real);
    imag=numeric.transpose(imag);

    var [res_i,res_r]=[1,2].map(function (_) {return new Array(sz2)});
    for(var i=0; i<sz1; ++i) {
        var t=(new numeric.T(real[i],imag[i])).fft();
        res_r[i]=t.x;
        res_i[i]=t.y;
    }
    return (new numeric.T(res_r,res_i)).transpose();
}

function fft_cent(mat) {
    return fftshiftT(fft2d(fftshift(mat)));
}

function reshapev(v, newshape) {
    //which way?
    var res=new Array(newshape[0]);
    for(var ir=0, io=0; io<v.length; io+=newshape[1],++ir)
        res[ir]=v.slice(io,io+newshape[1]);
    return res;
}



function fftProjectMode(v) {
    //for each degree of freedom in the array
    var degrees=numeric.transpose(reshapev(v,[v.length/2,2]));
    var res=zeros(N,N);
    degrees.forEach(function (deg){
        var projectionPortion=fft_cent(reshapev(deg,[N,N])).abs();
        projectionPortion=numeric.mul(projectionPortion.x,projectionPortion.x);
        numeric.addeq(res,projectionPortion);
    })

    numeric.muleq(res,1/(N*N));
    return res;
}




function pseudocolourOne(value,min,max) {
    var v = Math.round((1-(value-min)/(max-min))*255);
    return [v,v,v];
}

function pseudocolour(mat,options) {
    options = options || {};
    options.min = options.min===undefined ? min2(mat) : options.min;
    options.max = options.max===undefined?  max2(mat) : options.max;

    return map2(mat,function (v) {return pseudocolourOne(v,options.min,options.max)});
}

function fillBorder(mat) {
    var res=new Array(mat.length+1);
    for(var i=0; i<res.length; ++i) {
        var v=mat[i % mat.length];
        res[i]=v.concat([v[0]]);
    }
    return res;
}
function ones(n) {
    var res=new Array(n);
    res.fill(1);
    return res;
}

function cumsum(v) {
    var cumulant=0;
    return v.map(function (el) {
        cumulant+=el;
        return cumulant;
    });
}


function mat2svg(mat,options) {
    options=options || {};
    if(!options.widths) {
        options.widths=numeric.mul(10, ones(mat[0].length));
    }
    if(!options.heights) {
        options.heights=numeric.mul(10, ones(mat.length));
    }
    options.paddingx = options.paddingx || 0;
    options.paddingy = options.paddingy || 0;
    options.border = options.border || 'none';
    options.borderColour = options.borderColour || 'bisque';

    var xpositions=cumsum([options.paddingx].concat(options.widths));
    var ypositions=cumsum([options.paddingy].concat(options.heights));

    var w_res = options.paddingx+xpositions[xpositions.length-1];
    var h_res = options.paddingy+ypositions[ypositions.length-1];

    var res = createSVGElement('svg',{width:w_res,
                                      height:h_res,
                                      style:`border: ${options.border}; border-color: ${options.borderColour};`});
    var colours = pseudocolour(mat,{min:0,max:1});

    forEach2(colours, function (colour, ri, ci){
        var box = createSVGElement('rect', {x:xpositions[ci],
                                            y:ypositions[ri],
                                            width:options.widths[ci],
                                            height:options.heights[ri],
                                            fill:`rgb(${colour[0]},${colour[1]},${colour[2]})`,
                                            stroke:'none'});
        res.appendChild(box);
    });
    return res;
}

function line(v1,v2,N){
    var res=new Array(N);
    for(var n=0; n<N; ++n) {
        var t=n/(N-1);
        res[n]=numeric.addVV(numeric.mul(1-t,v1),numeric.mul(t,v2)).map(Math.round);
    }
    return res;
}

function mean(mat) {
    return numeric.mul(1/mat.length,numeric.add(...mat));
}

function indexHunt(indices,mat) {
    return indices.map(function ([i1,i2]) {
        return mat[i1][i2];
    });
}

function extractTri(mat) {
    //A good question, should I average here? It would improve the quality
    sz=mat.length/2;
    var res=new Array(sz*3+1);

    //(0,0) to (0.5,0.5)
    var sec1=mean([indexHunt(line([sz,sz],[0,sz],sz+1),mat),
                   indexHunt(line([sz,sz],[sz,0],sz+1),mat)]);

    var sec2=mean([indexHunt(line([sz,0],[1,0],sz),mat),
                   indexHunt(line([sz,0],[sz*2-1,0],sz),mat),
                   indexHunt(line([0,sz],[0,1],sz),mat),
                   indexHunt(line([0,sz],[0,sz*2-1],sz),mat)]);

    sec2=sec2.slice(1);

    var sec3=[mat[0][0]];
    var sec4=mean([indexHunt(line([1,1],[sz,sz],sz),mat),
                   indexHunt(line([sz*2-1,sz*2-1],[sz,sz],sz),mat)]);
    return sec1.concat(sec2).concat(sec3).concat(sec4);
}

function histDispersionCurves(eigenvalues,eigenfunctions,N,maxE) {
    maxE=maxE || Math.max(...eigenvalues);
    N=N || 50;

    var t=extractTri(fftProjectMode(eigenfunctions[0]));
    var res=zeros(N,t.length);
    for(var i=0; i<eigenvalues.length; ++i) {
        var e=eigenvalues[i];
        var binN=Math.round(e/maxE*(N-1));
        if(binN<N && binN>=0) {
            var ttt=res[binN]
            numeric.addeq(ttt, extractTri(fftProjectMode(eigenfunctions[i])));
            ttt;
        }
    }
    return res;
}

//random configuration generations
//all on
//all off
//random
//mer-fac-whatever

//colorbar
//different colormaps
//log colormap?
//save figures


// The following are ok functions, but I just realized I only need the function above
//
//function stepSlice(v,start,step,end) {
//    end=end || v.length;
//    var resLen=Math.floor((end-start)/step);
//    var res=new Array(resLen);
//    for(var i1=0,i2=start; i2<end; i1++, i2+=step)
//        res[i1]=v[i2];
//    return res;
//}
//function odd(v){
//    return stepSlice(v,1,2);
//}
//function even(v){
//    return stepSlice(v,0,2);
//}



//motion according to the eigenvector
//and drag links along
//and draw arrows



//after everything works - if it does - refactor in OOP with atoms, links, bonds being objects and being able to draw add/delete themselves so that interactive visualizations will become possible









