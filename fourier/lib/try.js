var a = 15;
debugger;
console.log('past breakpoint');

//Write a range function that takes two arguments, start and end, and returns an array containing all the numbers from start up to (and including) end.

function range(start, end, step) {
    var a = [];
    if (arguments.length == 2) {
        var step = 1;}
    if (step > 0) {
        for (var i = start; i <= end; i += step) {
            a.push(i);
        }
    }
    else if (step < 0) {
        for (var i = start; i >= end; i += step) {
            a.push(i);
        }
    }
    return a;
}

document.write(range(5, 2, -1));
 
//Next, write a sum function that takes an array of numbers and returns the sum of these numbers. Run the previous program and see whether it does indeed return 55.
 
 function sum(array) {
     var sumArray = 0;
     for (var i = 0; i < array.length; i++) {
         sumArray += array[i];
     }
     return sumArray;
 }

document.write(sum(range(1,10)));

function reverseArray(arrayValue) {
    newArray = [];
    for (i = arrayValue.length; i >= 0; i--) {
        newArray.push(arrayValue[i]);
    }
    return newArray;
}

function reverseArrayInPlace(arrayValue) {
    var temp;
    for (i = 0; i <= Math.floor(arrayValue.length/2); i++) {
        temp = arrayValue[i];
        arrayValue[i] = arrayValue[arrayValue.length - i];
        arrayValue[arrayValue.length - i] = temp;
    }
    return arrayValue;
}

document.write(reverseArray(["A", "B", "C"]));
// → ["C", "B", "A"];
var arrayValue = [1, 2, 3, 4, 5];
reverseArrayInPlace(arrayValue);
document.write(arrayValue);
// → [5, 4, 3, 2, 1]