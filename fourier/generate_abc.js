window.onload = function() {
    var letter_targ = document.getElementById('letters');
    letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ()*&^%$£"!,./?~#@;:[]{}1234567890';
    
    for(var i=0; i<letters.length; ++i)
        addLetter(letter_targ, letters[i]);
    
    
    console.log('done');
}

//<tr><th>one</th><th>res</th></tr>
function addLetter(target, letter) {
    var tr=document.createElement('tr');
    var width=256;
    tr.innerHTML=`<th><canvas id="targ" width="${width}" height="${width}"></canvas></th><th><canvas id="transform" width="${width}" height="${width}"></canvas></th>`;
    
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