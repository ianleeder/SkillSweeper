// Author: Ian Leeder
// Date: 07 November 2014

// CONSTANTS
var CELL_SIZE = 25;
var BORDER_SIZE = 5;


// VARIABLES
var header = new Box(0, 0, 0, 150);
var field = new Box(0, 15)

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
	ctx.translate(field.x, field.y);

	for(var i=0;i<gameGrid.length;i++) {
		for(var j=0;j<gameGrid[i].length;j++) {
			ctx.fillStyle = getRandomColor();
			ctx.fillRect(i*CELL_SIZE, j*CELL_SIZE, CELL_SIZE, CELL_SIZE);
		}
	}

	ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function drawHeader() {
	ctx.translate(header.x, header.y);

	ctx.fillStyle = "#FF0000";
	ctx.fillRect(0, 0, header.width, header.height);
	
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

function initialiseCanvas() {
	var width = difficulty.x * CELL_SIZE;
	header = new Box(BORDER_SIZE, BORDER_SIZE, width, 150);
	field = new Box(BORDER_SIZE, 150+(2*BORDER_SIZE), difficulty.x * CELL_SIZE, difficulty.y * CELL_SIZE);

	canvas.width = (2 * BORDER_SIZE) + field.width;
	canvas.height = field.y + field.height + BORDER_SIZE;
}

function initialiseField() {
	gameGrid = new Array(difficulty.x);
	// Create empty array for grid
	for(var i = 0; i < gameGrid.length; i++) {
		gameGrid[i] = new Array(difficulty.y);
	}
}

function drawCanvas()
{
	ctx.fillStyle = "#000000";
	ctx.fillRect(0,0,canvas.width, canvas.height);

	drawHeader();
	drawField();
}

function mouseClickHandler(e)
{
	if (!e.which && e.button) {
		if (e.button & 1) e.which = 1      // Left
		else if (e.button & 4) e.which = 2 // Middle
		else if (e.button & 2) e.which = 3 // Right
	}

	var X = e.pageX - this.offsetLeft 
	var Y = e.pageY - this.offsetTop

	if(X < field.x || X > (field.x + field.width) || Y < field.y || Y > (field.y + field.height))
	{
		return;
	}

	alert("X = " + X + ", Y = " + Y);
}

function registerListeners()
{
	canvas.onclick = mouseClickHandler;
}

function init() {
	initialiseCanvas();
	initialiseField();
	registerListeners();
	drawCanvas();
}
