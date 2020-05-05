function drawSection(center, drawingTarget) {
    "use strict";
    
    drawingTarget.innerHTML = "";
    
    var supercell = 1;
    for (var i=0; i<N; ++i) 
        for (var j=0; j<N; ++j) {
            
            var r = numeric.sub([i,j], center);
            var x = r[0]*scale;
            var y = r[1]*scale;

            var phi = structure[i*N + j][0]; 
            var dx = Math.cos(phi)/2*len;
            var dy = Math.sin(phi)/2*len;

            for (var is=0; is<supercell; ++is)
                 for (var js=0; js<supercell; ++js){
                     var xs = is*scale*N;
                     var ys = js*scale*N;

                     var g=createSVGElement('g',{transform:`translate(${x+xs} ${y+ys}) rotate(${rad2deg(phi)}) scale(${len/1000} ${len/1000}) translate(-391 -182)`});

                     var l=createSVGElement('polygon',{points:"902.25049,222.98633 233.17773,222.98633 233.17773,364.71875 0,182.35938 233.17773,0 233.17773,141.73242 902.25049,141.73242 902.25049,222.98633 ",
                               fill:`hsl(${Math.round(rad2deg(phi))}, 90%, 30%)`});

                     g.appendChild(l);
                    drawingTarget.appendChild(g);

             }
         }
}