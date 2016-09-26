// Author: Ian Leeder
// Date: 07 November 2014

// CONSTANTS
var CELL_SIZE = 30;


// VARIABLES

var header = new Box(0, 0, 200, 150);

var gameGrid;

var beginnerDifficulty = {x:8, y:8, mines:10};
var intermediateDifficulty = {x:16, y:16, mines:40};
var expertDifficulty = {x:24, y:24, mines:99};

var difficulty = expertDifficulty;


// Get the canvas context
var canvas = document.getElementById('skillSweeperCanvas');
var ctx = canvas.getContext('2d');

init();
drawField();

function Box(x, y, width, height) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
}

function drawField() {
	ctx.fillStyle = "#000000";
	ctx.fillRect(0,0,canvas.width, canvas.height);

	ctx.translate(10, 20);

	for(var i=0;i<gameGrid.length;i++) {
		for(var j=0;j<gameGrid[i].length;j++) {
			ctx.fillStyle = getRandomColor();
			ctx.fillRect(i*CELL_SIZE, j*CELL_SIZE, CELL_SIZE, CELL_SIZE);
		}
	}

	ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function init() {
	canvas.width = difficulty.x * CELL_SIZE;
	canvas.height = (difficulty.y * CELL_SIZE);// + headerHeight;

	gameGrid = new Array(difficulty.x);
	// Create empty array for grid
	for(var i = 0; i < gameGrid.length; i++) {
		gameGrid[i] = new Array(difficulty.y);
	}
}
