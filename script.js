// Author: Ian Leeder
// Date: 25 September 2016

// CONSTANTS
var CELL_SIZE = 25;
var CELL_BEZEL = 4;
var CELL_BEZEL_LIGHT_COLOUR = "#FCFCFC";
var CELL_COLOUR_UNREVEALED = "#B4B4B4";
var CELL_COLOUR_REVEALED = "#B4B4B4";
var CELL_BEZEL_DARK_COLOUR = "#696969";

var BORDER_SIZE = 5;
var FIELD_FONT = "20px Georgia";


// Define a base level box
var Box = function(xPos, yPos, width, height) {
	this.xPos = xPos;
	this.yPos = yPos;
	this.width = width;
	this.height = height;
}

// Create a function for Box
Box.prototype.SayHello = function() {
	console.log("Width = " + this.width);
}

// Create a gridbox constructor
function GridBox(x, y) {
	Box.call(this, field.xPos + x*CELL_SIZE, field.yPos + y*CELL_SIZE, CELL_SIZE, CELL_SIZE);
	this.xIndex = x;
	this.yIndex = y;

	this.number = 0;
	this.revealed = false;
	this.isMine = false;
	this.isFlagged = false;
}

// Make GridBox extend Box
GridBox.prototype = Object.create(Box.prototype);

// Set the constructor for the GridBox object
GridBox.prototype.constructor = GridBox;

GridBox.prototype.SayHello = function() {
	console.log("Height = " + this.height);
}

GridBox.prototype.countAdjacentMines = function() {
	if(this.isMine)
		return;

	// In the general case we want to look from one left to one right,
	// and from one above to one below.
	// However the easiest way to do bounds checks it to use min/max cleverly.
	for(var i = Math.max(this.xIndex-1, 0); i<Math.min(this.xIndex+2,difficulty.x); i++)
		for(var j = Math.max(this.yIndex-1, 0); j<Math.min(this.yIndex+2,difficulty.y); j++)
			if(gameGrid[i][j].isMine)
				this.number++;
}

GridBox.prototype.drawCell = function() {
	// Fill square to begin with
	ctx.fillStyle = CELL_COLOUR_UNREVEALED;
	ctx.fillRect(0, 0, this.width, this.height);

	// draw light bezel on top-left of cell
	ctx.fillStyle = CELL_BEZEL_LIGHT_COLOUR;
	ctx.beginPath();
	ctx.moveTo(0, this.height); // bottom-left
	ctx.lineTo(CELL_BEZEL, this.height - CELL_BEZEL); // inset bottom-eft
	ctx.lineTo(CELL_BEZEL, CELL_BEZEL); // inset top-left
	ctx.lineTo(this.width - CELL_BEZEL, CELL_BEZEL); // inset top-right
	ctx.lineTo(this.width, 0); // top-right
	ctx.lineTo(0, 0); // top-left
	ctx.closePath();
	ctx.fill();

	// draw dark bezel on bottom-right of cell
	ctx.fillStyle = CELL_BEZEL_DARK_COLOUR;
	ctx.beginPath();
	ctx.moveTo(0, this.height); // bottom-left
	ctx.lineTo(CELL_BEZEL, this.height - CELL_BEZEL); // inset bottom-eft
	ctx.lineTo(this.width - CELL_BEZEL, this.height - CELL_BEZEL); // inset bottom-right
	ctx.lineTo(this.width - CELL_BEZEL, CELL_BEZEL); // inset top-right
	ctx.lineTo(this.width, 0); // top-right
	ctx.lineTo(this.width, this.height); // bottom-right
	ctx.closePath();
	ctx.fill();
}

GridBox.prototype.draw = function() {

	if(this.xIndex == 0 && this.yIndex == 0)
		console.log("first square");

	ctx.translate(this.xPos, this.yPos);
	if(!this.revealed)
	{
		this.drawCell();
	}
	
	ctx.fillStyle = "#000000";
	ctx.font = FIELD_FONT;
	if(this.isMine) {
		ctx.fillText("X", 5, this.height - 5);
	} else {
		ctx.fillText(this.number, 5, this.height - 5);
	}

	ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// VARIABLES
var header = new Box(0, 0, 0, 150);
var field = new Box(0, 15)

var gameGrid;

var beginnerDifficulty = {x:8, y:8, mines:10};
var intermediateDifficulty = {x:16, y:16, mines:40};
var expertDifficulty = {x:24, y:24, mines:99};

var difficulty = beginnerDifficulty;


// Get the canvas context
var canvas = document.getElementById('skillSweeperCanvas');
var ctx = canvas.getContext('2d');

init();
drawField();

function drawField() {
	for(var i=0;i<gameGrid.length;i++) {
		for(var j=0;j<gameGrid[i].length;j++) {
			gameGrid[i][j].draw();
		}
	}

	ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function drawHeader() {
	ctx.translate(header.xPos, header.yPos);

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
	header = new Box(BORDER_SIZE, BORDER_SIZE, width, 50);
	field = new Box(BORDER_SIZE, header.height+(2*BORDER_SIZE), difficulty.x * CELL_SIZE, difficulty.y * CELL_SIZE);

	canvas.width = (2 * BORDER_SIZE) + field.width;
	canvas.height = field.yPos + field.height + BORDER_SIZE;
}

function initialiseField() {
	gameGrid = new Array(difficulty.x);
	// Create empty array for grid
	for(var i = 0; i < gameGrid.length; i++) {
		gameGrid[i] = new Array(difficulty.y);
		for(var j=0; j<gameGrid[i].length; j++)
			gameGrid[i][j] = new GridBox(i,j);
	}

	// Place mines
	for(var m=0; m<difficulty.mines; m++)
	{
		var placed = false;
		// Loop until we have placed a mine
		do {
			var x = Math.floor(Math.random() * difficulty.x);
			var y = Math.floor(Math.random() * difficulty.y);

			if(!gameGrid[x][y].isMine) {
				gameGrid[x][y].isMine = true;
				placed = true;
			}
		}
		while (!placed)
	}

	// Count mines
	for(var i = 0; i < gameGrid.length; i++)
		for(var j=0; j<gameGrid[i].length; j++)
			gameGrid[i][j].countAdjacentMines();
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

	if(X < field.xPos || X > (field.xPos + field.width) || Y < field.yPos || Y > (field.yPos + field.height))
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
