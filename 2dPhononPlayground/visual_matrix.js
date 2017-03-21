//window.onload = function() {
//    var matrix = [[1,2,3],[4,5,6],[7,8,9]];
//    var matrixTarget = document.getElementById('matrix');
//    updateMatrix(matrix,matrixTarget);
//
//    var vec=[[1],[2],[3]]
//    var vecTarget = document.getElementById('vector');
//    updateMatrix(vec,vecTarget);
//
//    var res=numeric.dot(matrix,vec);
//    var resTarget = document.getElementById('result');
//    updateMatrix(res,resTarget);
//}

function truncate(val) {
    if(typeof(val)==="number")
        return Math.round(val*100)/100;
    else
        return val;
}

function updateTable(matrix, tableTarget, style) {
    tableTarget.innerHTML='';

    if(style)
        tableTarget.setAttribute('style', style);

    matrix.forEach(function (line){
        var lineDOM = document.createElement('tr');
        tableTarget.appendChild(lineDOM);
        line.forEach(function (element){
            var el = document.createElement('td');
            el.textContent = truncate(element);
            lineDOM.appendChild(el);
        });
    });
}

function updateMatrix(matrix, matrixTarget, options){

    options = options || {needsBorderLeft:true,
                          needsBorderRight:true};
    if(options.needsBorders) {
        options.needsBorderLeft = true;
        options.needsBorderRight = true;
    }

    matrixTarget.innerHTML='';

    if(options.needsBorderLeft) {
        var leftBorder = document.createElement('div');
        leftBorder.classList=['leftBorder'];
        matrixTarget.appendChild(leftBorder);
    }


    var table = document.createElement('table');
    matrixTarget.appendChild(table);
    updateTable(matrix, table, options.style);


    if(options.needsBorderRight) {
        var rightBorder = document.createElement('div');
        rightBorder.classList=['rightBorder'];
        matrixTarget.appendChild(rightBorder);
    }


}
