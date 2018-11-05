window.onload = function() {
    var letter_targ = document.getElementById('letters');
    letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ()*&^%$£"!,./?~#@;:[]{}1234567890';
    
    for(var i=0; i<letters.length; ++i)
        addLetter(letter_targ, letters[i]);
    
//    <a onclick="saveAll();" href="#">Save all</a>
    
    var a = document.createElement('button');
    a.addEventListener('click',saveAll);
    a.textContent="Save all";
    document.getElementById('wrapper').appendChild(a);
    
    console.log('done');
}

//<tr><th>one</th><th>res</th></tr>
function addLetter(target, letter) {
    var tr=document.createElement('tr');
    var width=256;
    tr.innerHTML=`<th><canvas id="${letter}_im" width="${width}" height="${width}"></canvas></th><th><canvas id="${letter}_ft" width="${width}" height="${width}"></canvas></th>`;
    
    target.appendChild(tr);
    var ctx_letter = tr.childNodes[0].childNodes[0].getContext('2d');
    var ctx_ft = tr.childNodes[1].childNodes[0].getContext('2d');
    
    
    var w=ctx_letter.canvas.width;
    var h=ctx_letter.canvas.height;

    clear(ctx_letter);
    ctx_letter.translate(w/2, h/2);
    
    drawLetter(ctx_letter, letter, 40);
    
    fftContext(ctx_letter, ctx_ft, 50);
}

function drawLetter(ctx, letter, sz) {
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.font = `${sz}px serif`;
    ctx.fillText(letter, 0, 0)
}

function saveAll() {
    
    var canvases = document.getElementsByTagName('canvas');
    var i=0;
    function saveOne() {
        if(i<canvases.length){
            var cnv = canvases[i];
        
            var dataURL = cnv.toDataURL('image/png');

            var a = document.createElement('a');
            a.setAttribute('download',cnv.getAttribute('id')+'.png');
            a.href = dataURL;
            a.click();
            
            ++i;
            setTimeout(saveOne, 200);
        }
    }
    saveOne();

}