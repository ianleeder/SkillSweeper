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
var FIELD_FONT = "18px Courier";

// State variables
var GAMESTATE_NEW = 1;
var GAMESTATE_RUNNING = 2;
var GAMESTATE_DEAD = 3;
var GAMESTATE_WON = 4;

var NUMBER_COLOURS = [
	"#FF7701", // Should never hit this, number 0
	"#0C24FA", // 1 Blue
	"#107E12", // 2 Green
	"#FB0D1B", // 3 Red
	"#030C7E", // 4 Dark blue
	"#7F040A", // 5 Maroon
	"#118080", // 6 Teal
	"#000000", // 7 Black
	"#808080"  // 8 Grey
];

// Define a base level box
var Box = function(xPos, yPos, width, height) {
	this.xPos = xPos;
	this.yPos = yPos;
	this.width = width;
	this.height = height;
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

GridBox.prototype.drawMine = function() {
	var centerX = this.width / 2;
	var centerY = this.height / 2;
	var radius = 5;

	ctx.beginPath();
	ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
	ctx.fillStyle = "#000000";
	ctx.fill();

	ctx.beginPath();
	ctx.moveTo(centerX - radius - 2, centerY);
	ctx.lineTo(centerX + radius + 2, centerY);
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(centerX, centerY - radius - 2);
	ctx.lineTo(centerX, centerY + radius + 2);
	ctx.stroke();

	centerX = 3 * this.width / 7;
	centerY = 3 * this.height / 7;
	radius = 2;
	ctx.beginPath();
	ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
	ctx.fillStyle = CELL_COLOUR_REVEALED;
	ctx.fill();
}

GridBox.prototype.drawFlag = function () {
	ctx.fillStyle = "#000000";
	ctx.beginPath();
	ctx.moveTo(8, this.height - 6);
	ctx.lineTo(8, this.height - 8);
	ctx.lineTo(this.width/2, this.height - 10);
	ctx.lineTo(this.width - 8, this.height - 8);
	ctx.lineTo(this.width - 8, this.height - 6);
	ctx.closePath();
	ctx.fill();

	ctx.beginPath();
	ctx.moveTo(this.width/2, this.height - 10);
	ctx.lineTo(this.width/2, this.height/2);
	ctx.stroke();

	ctx.fillStyle = "#FF0000";
	ctx.beginPath();
	ctx.moveTo(this.width/2, this.height/2);
	ctx.lineTo(this.width/2, 6);
	ctx.lineTo(8, 9)
	ctx.closePath();
	ctx.fill();
}

GridBox.prototype.draw = function() {
	ctx.translate(this.xPos, this.yPos);
	ctx.font = FIELD_FONT;
	if(this.revealed) {
		// first draw the blank cell
		ctx.fillStyle = CELL_COLOUR_REVEALED;
		ctx.strokeStyle = 'black';

		ctx.beginPath();
		ctx.rect(0, 0, this.width, this.height);
		ctx.fill();
		ctx.lineWidth = 1;
		ctx.stroke();

		if (this.isMine) {
			ctx.fillStyle = "#FF0000";
			ctx.strokeStyle = 'black';

			ctx.beginPath();
			ctx.rect(0, 0, this.width, this.height);
			ctx.fill();
			ctx.lineWidth = 1;
			ctx.stroke();
			this.drawMine();
		} else if(this.number > 0) {
			ctx.fillStyle = NUMBER_COLOURS[this.number];
			ctx.fillText(this.number, 7, this.height - 7);
		}
		
	} else {
		this.drawCell();

		if(this.isFlagged)
			this.drawFlag();
	}

	ctx.setTransform(1, 0, 0, 1, 0, 0);
}

GridBox.prototype.countAdjacentFlags = function() {
	var numFlags = 0;

	for(var i = Math.max(this.xIndex-1, 0); i<Math.min(this.xIndex+2,difficulty.x); i++)
		for(var j = Math.max(this.yIndex-1, 0); j<Math.min(this.yIndex+2,difficulty.y); j++)
			if(gameGrid[i][j].isFlagged)
				numFlags++;

	return numFlags;
}

GridBox.prototype.chord = function() {
	console.log("attempting to chord");

	if(this.number != this.countAdjacentFlags())
		return;

	if(this.number === 0)
		return;

	for(var i = Math.max(this.xIndex-1, 0); i<Math.min(this.xIndex+2,difficulty.x); i++)
		for(var j = Math.max(this.yIndex-1, 0); j<Math.min(this.yIndex+2,difficulty.y); j++)
			gameGrid[i][j].reveal();
}

GridBox.prototype.reveal = function() {
	// Do nothing
	if(this.revealed || this.isFlagged)
		return;

	// Game over man
	if(this.isMine)
	{
		this.revealed = true;
		this.draw();
		hitMine();
		return;
	}

	// Just reveal this cell and be done with it
	if(this.number != 0) {
		this.revealed = true;
		this.draw();
		return;
	}

	this.revealed = true;
	this.draw();

	// Now for the cascade!
	for(var i = Math.max(this.xIndex-1, 0); i<Math.min(this.xIndex+2,difficulty.x); i++)
		for(var j = Math.max(this.yIndex-1, 0); j<Math.min(this.yIndex+2,difficulty.y); j++)
			gameGrid[i][j].reveal();
}

// VARIABLES
var header = new Box(0, 0, 0, 150);
var field = new Box(0, 15)
var openFirstClick = true;

var gameState;
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

function drawField() {
	for(var i=0;i<gameGrid.length;i++)
		for(var j=0;j<gameGrid[i].length;j++)
			gameGrid[i][j].draw();
}

function drawHeader() {
	ctx.translate(header.xPos, header.yPos);

	ctx.fillStyle = "#FF0000";
	ctx.fillRect(0, 0, header.width, header.height);
	
	ctx.setTransform(1, 0, 0, 1, 0, 0);
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
}

function placeMines(clickX, clickY) {
	for(var m=0; m<difficulty.mines; m++)
	{
		var placed = false;
		// Loop until we have placed a mine
		do {
			var x = Math.floor(Math.random() * difficulty.x);
			var y = Math.floor(Math.random() * difficulty.y);

			// Make sure we don't place a mine where the first click was
			if(x === clickX && y === clickY)
				continue;

			if(openFirstClick &&
				x >= clickX - 1 &&
				x <= clickX + 1 &&
				y >= clickY - 1 &&
				y <= clickY + 1)
			{
				continue;
			}


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
	e.preventDefault();

	if (!e.which && e.button) {
		if (e.button & 1) e.which = 1      // Left
		else if (e.button & 4) e.which = 2 // Middle
		else if (e.button & 2) e.which = 3 // Right
	}

	var canvasX = e.pageX - this.offsetLeft;
	var canvasY = e.pageY - this.offsetTop;

	var fieldX = canvasX - field.xPos;
	var fieldY = canvasY - field.yPos;

	// if click occurred inside field
	if(canvasX >= field.xPos &&
		canvasX <= (field.xPos + field.width) &&
		canvasY >= field.yPos &&
		canvasY <= (field.yPos + field.height))
	{
		var xIndex = Math.floor(fieldX/CELL_SIZE);
		var yIndex = Math.floor(fieldY/CELL_SIZE);
		handleFieldClick(e, xIndex, yIndex);
		return;
	}
	newGame();
}

function handleFieldClick(e, x, y)
{
	if(gameState === GAMESTATE_NEW) {
		placeMines(x, y);
		startGame();
	}

	if(gameGrid[x][y].revealed) {
		gameGrid[x][y].chord();
	} else {

		// If it was a left-click reveal the cell
		if(e.which === 1)
		{
			gameGrid[x][y].reveal();
		} else if (e.which === 3) {
			// If it was a right-click, toggle flag state
			gameGrid[x][y].isFlagged = !gameGrid[x][y].isFlagged;
			gameGrid[x][y].draw();
		}		
	}
}

function startGame() {
	gameState = GAMESTATE_RUNNING;
	// start clock
}

function hitMine() {
	gameState = GAMESTATE_DEAD;
	alert("You are dead!");
	// show message
	// stop clock
	newGame();
}

function registerListeners() {
	canvas.onclick = mouseClickHandler;
	canvas.oncontextmenu = mouseClickHandler;
}

function newGame() {
	initialiseField();
	drawCanvas();
	gameState = GAMESTATE_NEW;
}

function init() {
	initialiseCanvas();
	registerListeners();
	newGame();
}
