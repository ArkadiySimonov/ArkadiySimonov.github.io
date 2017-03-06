function compareNumbers(a, b) {
  return a - b;
}

function createSVGElement(elem,attributes) {
    var ns="http://www.w3.org/2000/svg";
    c=document.createElementNS(ns,elem);
    for(a in attributes)
        c.setAttributeNS(null,a,attributes[a]);
    
    return c;
}

function e2link(e) {
     return e.target.parentElement.generatingLink;
}
function lineMouseOver(e) {
    
    var link=e2link(e);
    link.representations.forEach(function (g) {
        var [r,l] = g.childNodes;
        r.setAttributeNS(null,'fill','rgba(255, 166, 1,0.1)');
    });
    
}
function lineMouseOut(e) {
    var link=e2link(e);
    link.representations.forEach(function (g) {
        var [r,l] = g.childNodes;
        r.setAttributeNS(null,'fill','rgba(255, 166, 1,0.0)');
    });
}

function lineMouseClick(e) {
    var link=e2link(e);
    link.strong=!link.strong;
    
    link.representations.forEach(function (g) {
        var [r,l] = g.childNodes;
        l.setAttributeNS(null,'stroke',linkColor(link));
    });   
}

function updateLinkVisualizations() {
    links.forEach(function (link) {
        link.representations.forEach(function (g) {
            var [r,l] = g.childNodes;
            l.setAttributeNS(null,'stroke',linkColor(link));
        });
    })
}

function randomLinks() {
    links.forEach(function (link) {
        link.strong=Math.random()<0.5;
    });
    updateLinkVisualizations();
    refreshBondsAndCalculateEigenvectors()
}

function allStrong() {
    links.forEach(function (link) {
        link.strong=true;
    });
    updateLinkVisualizations();
    refreshBondsAndCalculateEigenvectors()
}
function allWeak() {
    links.forEach(function (link) {
        link.strong=false;
    });
    updateLinkVisualizations();
    setTimeout(refreshBondsAndCalculateEigenvectors,100);
    
}
function linksMerFac() {
    var col_ds=[];
    for(var i=0; i<N; ++i)
        col_ds.push(Math.random()<0.5 ? 1 : 0);
    
    downLinks.forEach(function (row,rown) {
        var row_d=Math.random()<0.5 ? 1 : 0;
        row.forEach(function (link,coln){
            link.strong = (row_d+coln) % 2 === 1;
//            at.links[0].strong = (col_ds[coln]+rown) % 2 === 1;
        });
    });
    
    rightLinks.forEach(function (row,rown) {
        row.forEach(function (link,coln){
            link.strong = (col_ds[coln]+rown) % 2 === 1;
        });
    });
    updateLinkVisualizations();
    refreshBondsAndCalculateEigenvectors()
}

function linksOrd() {
    downLinks.forEach(function (row,rown) {
        row.forEach(function (link,coln){
            link.strong = coln % 2 === 1;
        });
    });
    
    rightLinks.forEach(function (row,rown) {
        row.forEach(function (link,coln){
            link.strong = rown % 2 === 1;
        });
    });
    updateLinkVisualizations();
    refreshBondsAndCalculateEigenvectors()
}
function linksOrd2() {
    downLinks.forEach(function (row,rown) {
        row.forEach(function (link,coln){
            link.strong = coln % 2 === 1;
        });
    });
    
    rightLinks.forEach(function (row,rown) {
        row.forEach(function (link,coln){
            link.strong = (rown+coln) % 2 === 1;
        });
    });
    updateLinkVisualizations();
    refreshBondsAndCalculateEigenvectors()
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
window.onload=function() {
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

function arrow(x1,y1,x2,y2,color) {
    var m=2
    var baseWidth=2*m;
    var ahLen=6*m;
    var ahWidth=6*m;
    
    var len=Math.sqrt(sq(x2-x1)+sq(y2-y1));
    
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
    
//    var arrowPath='M0,0 l0,100 l100,0';
    
    var rotationAngle=Math.atan2(y2-y1,x2-x1)/Math.PI*180;
    return createSVGElement('path',{d:arrowPath,
                                    fill:color,
                                   stroke:'none',
                                   transform:`translate(${x1},${y1}), rotate(${rotationAngle})`});
}

function displacementArrow(at,v,lengthMult) {
    return arrow(at.x,at.y,at.x+v[0]*lengthMult,at.y+v[1]*lengthMult,'#c34300');
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
    
    if (document.getElementById('log').checked){
        t=map2(t,function(v) {return v>0 ? Math.log(v) : -10});
        min=-10;
        max=Math.log(2);
    }else{
        min=0;
        max=1;
    }
    
    t = mat2svg(fillBorder(t),{border:'solid',borderColour:'aliceblue',min:min,max:max});
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
    return [at2.i-at1.i,at2.j-at1.j].map(function(dx) {return (dx+N)%N});
}
function normalize(v) {
    return numeric.div(v,numeric.norm2(v));
}
function rot90(v) {
    return [v[1],-v[0]];
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

function argsort(arr) {
    var args=new Array(arr.length);
    for(var i=0; i<arr.length; ++i)
        args[i]=i;
    args.sort(function (a,b) {
        return compareNumbers(arr[a],arr[b]);
    });
    return args;
}
function reshuffle(arr,order) {
    res=new Array(order.length);
    for(var i=0; i<order.length; ++i){
        res[i]=arr[order[i]];
    }
    return res;
}

var eigenvalues,eigenvectors;
var marker;
var dispersionCurvesHistogram;
function moveMarker(e) {
    var t=e/marker.maxE;
    var y=marker.ymax*t+(1-t)*marker.ymin;
    marker.elem.setAttributeNS(null,'y',y)
}

function plotDispersionCurve() {
    var targ=document.getElementById('dispersionCurveDiv');
    
    if(targ.hasChildNodes()){
        targ.removeChild(targ.firstChild);
    }
    
    var h,min,max;
    if (document.getElementById('log').checked){
        h=map2(dispersionCurvesHistogram,function(v) {return v>0 ? Math.log(v) : -10});
        min=-10;
        max=Math.log(2);
    }else{
        h=dispersionCurvesHistogram;
        min=0;
        max=1;
    }
    
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
    var drawing=mat2svg(h,{paddingx:padding,
                           paddingy:padding,
                           border:'none',
                           widths:widths,
                           heights:heights,
                          min:min,
                          max:max});
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
const vert=30, maxE=6;
function calculateDispersionCurve() {
    dispersionCurvesHistogram = histDispersionCurves(eigenvalues, eigenvectors,vert,maxE);
    dispersionCurvesHistogram.reverse();
    
    plotDispersionCurve();
}

function calculateEigenvectors() {
//    var t = numeric.eig(dynamicMatrix,N*N*4*8);
//    eigenvalues=t.lambda.x;
//    eigenvectors=numeric.transpose(t.E.x); //maybe need to transpose
//    var ord=argsort(eigenvalues);
//    eigenvalues=reshuffle(eigenvalues,ord);
//    eigenvectors=reshuffle(eigenvectors,ord);
    
    var t=numeric.svd(dynamicMatrix);
    eigenvalues=t.S;
    eigenvalues.reverse();
    eigenvectors=numeric.transpose(t.V);
    eigenvectors.reverse();
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

function zeros(a,b){
    var res=new Array(a);
    for(var i=0; i<a; ++i) {
        res[i]=new Array(b);
        res[i].fill(0);
    }
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
    return mat.map(function (v) {
        return v.map(f);
    });
}

function forEach2(mat,f) {
    mat.forEach(function (v,ri) {
        v.forEach(function (el,ci) {
            f(el,ri,ci);
        });
    });
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
    
    options.min=options.min || 0;
    options.max=options.max || 1;
    
    var xpositions=cumsum([options.paddingx].concat(options.widths));
    var ypositions=cumsum([options.paddingy].concat(options.heights));
    
    var w_res = options.paddingx+xpositions[xpositions.length-1];
    var h_res = options.paddingy+ypositions[ypositions.length-1];

    var res = createSVGElement('svg',{width:w_res, 
                                      height:h_res,     
                                      style:`border: ${options.border}; border-color: ${options.borderColour};`});
    var colours = pseudocolour(mat,{min:options.min,max:options.max});
    
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









