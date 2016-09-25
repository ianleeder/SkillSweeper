
var cellSize = 30;

// Define header region
var header = new Box(0, 0, 200, 150);

var gameGrid;

var beginnerDifficulty = {x:8, y:8, mines:10};
var intermediateDifficulty = {x:16, y:16, mines:40};
var expertDifficulty = {x:24, y:24, mines:99};

var difficulty = expertDifficulty;


// Get the canvas context
var canvas = document.getElementById('myCanvas');
canvas.width = difficulty.x * cellSize;
canvas.height = (difficulty.y * cellSize) + headerHeight;

var canvasContext = canvas.getContext('2d');

canvasContext.fillStyle = "#000000";
	canvasContext.fillRect(0, 0, canvas.width, canvas.height);


function Box(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
}

function drawField() {
	for(var i=0;i<gameGrid.length;i++) {
		for(var j=0;j<gameGrid[i].length;j++) {
			if(gameGrid[i][j]) {
				canvasContext.drawImage(gameGrid[i][j].image, TILE_SIZE*(i+1), TILE_SIZE*(j+1));
			}
		}
	}
}

function init() {
   gameGrid = new Array(difficulty.x);
// Create empty array for grid
	for(var i = 0; i < gameGrid.length; i++) {
		gameGrid[i] = new Array(difficulty.y);
}