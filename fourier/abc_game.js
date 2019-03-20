
var letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ()*&^%$£"!,./?~#@;:[]{}1234567890';
var task_ctx, vars_ctx;
var solution_cnv, temp_ctx;
var score = 0;
var attempts = 0;

window.onload = function() {
//    hidden_cnv = document.createElement('canvas'); 
//    hidden_cnv.setAttribute('width', 256);
//    hidden_cnv.setAttribute('height', 256);
    
    solution_cnv = document.getElementById('solution');
    temp_ctx = solution_cnv.getContext('2d');
    task_ctx=document.getElementById('task').getContext('2d');

    var option_cnv = document.querySelectorAll('#variants > div > canvas');
    vars_ctx = [0,1,2].map(function (n){
        return option_cnv[n].getContext('2d');
    });
    
    runGame();
}

function randi(N) {
    return Math.floor(Math.random()*N);
}

function randi_arr(Nel, maxI) {
    //does not quite work
    var seen={};
    var res=[];
    while(res.length<Nel) {
        var candidate = randi(maxI);
        if(!(candidate in seen)){
            res.push(candidate)
            seen[candidate]='true';
        }
    }
    return res;
}

var correct_solution;
function runGame() {
    solution_cnv.classList.add('hidden');
    var vars = randi_arr(3, letters.length);
    var correct = randi(3);
    correct_solution = correct;
    
    vars.forEach(function (v, n) {
        drawLetter(vars_ctx[n], letters[v], 40); 
    });
    
    drawLetter(temp_ctx, letters[vars[correct]], 40);
    fftContext(temp_ctx, task_ctx, 50);
    
}

function drawLetter(ctx, letter, sz) {
    ctx.setTransform(1,0,0,1,0,0);
    clear(ctx);
    
    var w=ctx.canvas.width;
    var h=ctx.canvas.height;
    
    ctx.translate(w/2, h/2);
    
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.font = `${sz}px serif`;
    ctx.fillText(letter, 0, 0);
}

function guess(n) {
    solution_cnv.classList.remove('hidden');
    attempts++;
    if(n===correct_solution)
        score++;
    
    document.getElementById('score').innerHTML=`Score: ${score}/${attempts}`;
    
}



