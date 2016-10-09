// Author: Ian Leeder
// Date: 25 September 2016

var skillSweeper = (function() {
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
	var GAMESTATE_PAUSED = 5;
	var GAMESTATE_AUTOPLAY = 6;

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

	Box.prototype.offsetDrawingContext = function() {
		resetDrawingContext();
		ctx.translate(this.xPos, this.yPos);
	}

	function resetDrawingContext() {
		ctx.setTransform(1, 0, 0, 1, 0, 0);
	}

	Box.prototype.isClickInside = function(clickX, clickY) {
		return clickX >= this.xPos &&
				clickX <= (this.xPos + this.width) &&
				clickY >= this.yPos &&
				clickY <= (this.yPos + this.height);
	}

	Box.prototype.drawBezel = function() {
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

	// Create a gridbox constructor
	function GridBox(x, y) {
		Box.call(this, field.xPos + x*CELL_SIZE, field.yPos + y*CELL_SIZE, CELL_SIZE, CELL_SIZE);
		this.xIndex = x;
		this.yIndex = y;

		this.number = 0;
		this.revealed = false;
		this.isMine = false;
		this.isFlagged = false;
		this.skillSafe = false;
		this.skillFlag = false;
		this.neighbours = [];
	}

	// Make GridBox extend Box
	GridBox.prototype = Object.create(Box.prototype);

	// Set the constructor for the GridBox object
	GridBox.prototype.constructor = GridBox;

	// Create a button constructor
	function Button(x, y, width, height, text) {
		Box.call(this, x, y, width, height);

		this.text = text;
	}

	Button.prototype = Object.create(Box.prototype);
	Button.prototype.constructor = Button;

	function NumberBox(x, y, width, height) {
		Box.call(this, x, y, width, height);
	}

	NumberBox.prototype = Object.create(Box.prototype);
	NumberBox.prototype.constructor = NumberBox;

	NumberBox.prototype.draw = function(number) {
		// Confirm parameter is a number
		if(isNaN(parseFloat(number)) || !isFinite(number))
			return;

		if(number > 999)
			number = 999;

		// Pad to 3 digits
		number = number.toString();
		while(number.length < 3) {
			number = "0" + number;
		}

		this.offsetDrawingContext();

		// Draw the background
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, this.width, this.height);

		// Draw the text
		ctx.fillStyle = "#FF0000";
		ctx.font = "bold 30px Courier New";
		ctx.fillText(number, 5, this.height-5);
	}

	Button.prototype.draw = function() {
		this.offsetDrawingContext();
		ctx.fillStyle = CELL_COLOUR_UNREVEALED;
		ctx.fillRect(0, 0, this.width, this.height);
		this.drawBezel();

		ctx.fillStyle = "#000000";
		ctx.font = "14px Courier";
		ctx.fillText(this.text, 7, this.height - 7);
	}

	GridBox.prototype.init = function() {
		// In the general case we want to look from one left to one right,
		// and from one above to one below.
		// However the easiest way to do bounds checks it to use min/max cleverly.
		for(var i = Math.max(this.xIndex-1, 0); i<Math.min(this.xIndex+2,difficulty.x); i++) {
			for(var j = Math.max(this.yIndex-1, 0); j<Math.min(this.yIndex+2,difficulty.y); j++) {
				if(i == this.xIndex && j == this.yIndex)
					continue;

				this.neighbours.push(gameGrid[i][j]);
			}
		}

		this.countAdjacentMines();
	}

	GridBox.prototype.countAdjacentMines = function() {
		if(this.isMine)
			return;

		for(var i=0; i<this.neighbours.length; i++)
			if(this.neighbours[i].isMine)
				this.number++;
	}

	GridBox.prototype.drawCellButton = function(showHint) {
		this.offsetDrawingContext();

		// Fill square to begin with
		// Color if cell is known safe or mine
		if(this.skillFlag && (gameState === GAMESTATE_AUTOPLAY || showHint))
			ctx.fillStyle = "#F4B4B4";
		else if (this.skillSafe && (gameState === GAMESTATE_AUTOPLAY || showHint))
			ctx.fillStyle = "#B4F4B4";
		else
			ctx.fillStyle = CELL_COLOUR_UNREVEALED;

		ctx.fillRect(0, 0, this.width, this.height);

		this.drawBezel();
	}

	GridBox.prototype.drawMine = function() {
		this.offsetDrawingContext();

		var centerX = this.width / 2;
		var centerY = this.height / 2;
		var radius = 5;

		ctx.beginPath();
		ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
		ctx.fillStyle = "#000000";
		ctx.fill();

		ctx.strokeStyle = "#000000";
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
		this.offsetDrawingContext();

		ctx.fillStyle = "#000000";
		ctx.beginPath();
		ctx.moveTo(8, this.height - 6);
		ctx.lineTo(8, this.height - 8);
		ctx.lineTo(this.width/2, this.height - 10);
		ctx.lineTo(this.width - 8, this.height - 8);
		ctx.lineTo(this.width - 8, this.height - 6);
		ctx.closePath();
		ctx.fill();

		ctx.strokeStyle = "#000000";
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

		// If incorrectly flagged and game is over, then show a cross
		if(gameState === GAMESTATE_DEAD && !this.isMine) {
			ctx.strokeStyle = "#FF0000";
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(this.width, this.height);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(this.width, 0);
			ctx.lineTo(0, this.height);
			ctx.stroke();
		}
	}

	GridBox.prototype.drawRevealedSquare = function() {
		this.offsetDrawingContext();
		ctx.fillStyle = CELL_COLOUR_REVEALED;
		ctx.fillRect(0, 0, this.width, this.height);
		this.drawSquareOutline();
		ctx.stroke();
	}

	GridBox.prototype.drawRevealedMine = function() {
		this.offsetDrawingContext();
		ctx.fillStyle = "#FF0000";
		ctx.fillRect(0, 0, this.width, this.height);
		this.drawSquareOutline();
		this.drawMine();
	}

	GridBox.prototype.drawSquareOutline = function() {
		this.offsetDrawingContext();
		ctx.strokeStyle = 'black';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.rect(0, 0, this.width, this.height);
		ctx.stroke();
	}

	GridBox.prototype.drawNumber = function() {
		this.offsetDrawingContext();
		ctx.font = FIELD_FONT;
		ctx.fillStyle = NUMBER_COLOURS[this.number];
		ctx.fillText(this.number, 7, this.height - 7);
	}

	GridBox.prototype.draw = function() {
		if(this.revealed) {
			// first draw the blank cell
			this.drawRevealedSquare();

			if (this.isMine) {
				this.drawRevealedMine();
			} else if(this.number > 0) {
				this.drawNumber();
			}
		}
		// Otherwise if game is over and mine isn't flagged, show the mine
		else if(gameState === GAMESTATE_DEAD && this.isMine && !this.isFlagged) {
			this.drawRevealedSquare();
			this.drawMine();
		} else {
			this.drawCellButton();

			if(this.isFlagged)
				this.drawFlag();
		}
	}

	GridBox.prototype.countAdjacentFlags = function() {
		var numFlags = 0;

		for(var i=0; i<this.neighbours.length; i++)
			if(this.neighbours[i].isFlagged)
				numFlags++;

		return numFlags;
	}

	GridBox.prototype.countAdjacentUnrevealed = function() {
		var numUnrevealed = 0;

		for(var i=0; i<this.neighbours.length; i++)
			if(!this.neighbours[i].revealed)
				numUnrevealed++;

		return numUnrevealed;
	}

	GridBox.prototype.chord = function() {
		if(this.number != this.countAdjacentFlags())
			return;

		if(this.number === 0)
			return;

		for(var i=0; i<this.neighbours.length; i++)
			this.neighbours[i].reveal();
	}

	GridBox.prototype.reveal = function() {
		// Do nothing
		if(this.revealed || this.isFlagged)
			return;

		totalUnrevealed--;

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
		for(var i=0; i<this.neighbours.length; i++)
			this.neighbours[i].reveal();
	}

	GridBox.prototype.skillDetectFlag = function() {
		// Only look at revealed squares AND they have a number
		if(!this.revealed || this.number === 0)
			return false;

		if(this.countAdjacentFlags() >= this.number)
			return false;

		var anyMovesFound = false;

		if(this.countAdjacentUnrevealed() === this.number) {
			for(var i=0; i<this.neighbours.length; i++) {
				if(!this.neighbours[i].revealed && !this.neighbours[i].isFlagged) {
					this.neighbours[i].skillFlag = true;
					this.neighbours[i].draw();
					anyMovesFound = true;
				}
			}
		}

		return anyMovesFound;
	}

	GridBox.prototype.skillDetectSafe = function() {
		// Only look at revealed squares AND they have a number
		if(!this.revealed || this.number === 0)
			return false;

		if(this.countAdjacentFlags() != this.number)
			return false;

		var anyMovesFound = false;

		for(var i=0; i<this.neighbours.length; i++) {
			if(!this.neighbours[i].revealed && !this.neighbours[i].isFlagged) {
				this.neighbours[i].skillSafe = true;
				this.neighbours[i].draw();
				anyMovesFound = true;
			}
		}

		return anyMovesFound;
	}

	GridBox.prototype.equals = function(g2) {
		if(!(g2 instanceof GridBox))
			return false;

		return this.xIndex === g2.xIndex && this.yIndex === g2.yIndex;
	}

	GridBox.prototype.skillCrossReferenceNearby = function() {
		// Only look at revealed squares AND they have a number
		if(!this.revealed || this.number === 0)
			return false;

		if(this.isSatisfied())
			return false;

		var anyFound = false;

		// Need to look around ourself 2 squares out
		for(var i=Math.max(this.xIndex - 2, 0); i<=Math.min(this.xIndex + 2, difficulty.x-1); i++) {
			for(var j=Math.max(this.yIndex - 2, 0); j<=Math.min(this.yIndex + 2, difficulty.y-1); j++) {
				// don't compare to self
				if(i === this.xIndex && j === this.yIndex)
					continue;

				var nearby = gameGrid[i][j];

				if(!nearby.revealed)
					continue;
			
				var mutual = this.intersectingCells(nearby);
				if(!mutual)
					continue;

				var myExclusive = this.getExclusiveUnrevealed(mutual);
				var theirExclusive = nearby.getExclusiveUnrevealed(mutual);

				var myUnaccounted = this.number - this.countAdjacentFlags();
				var theirUnaccounted = nearby.number - nearby.countAdjacentFlags();

				// If (mytUnaccounted - myExclusive.length) === theirUnaccounted
				// Then all their exclusive are safe
				if(myUnaccounted - myExclusive.length === theirUnaccounted) {
					for(var k=0;k<theirExclusive.length;k++) {
						theirExclusive[k].skillSafe = true;
						theirExclusive[k].draw();
						anyFound = true;
					}
				}

				// If myUnaccounted === theirUnaccounted - theirExclusive.length
				// Then all their exclusives are bombs
				if(myUnaccounted === theirUnaccounted - theirExclusive.length) {
					for(var k=0;k<theirExclusive.length;k++) {
						theirExclusive[k].skillFlag = true;
						theirExclusive[k].draw();
						anyFound = true;
					}
				}
			}
		}
		return anyFound;
	}

	GridBox.prototype.isSatisfied = function() {
		if(this.number === 0)
			return true;

		if(!this.revealed)
			return true;

		return this.number === this.countAdjacentFlags();
	}

	GridBox.prototype.getExclusiveUnrevealed = function(mutual) {
		// First clone the array of neighbours
		var exclusive = this.neighbours.slice(0);

		// Find all the elements to remove
		var toRemove = [];

		for(var i=0; i<exclusive.length; i++) {
			if(exclusive[i].revealed || exclusive[i].isFlagged) {
				toRemove.push(i);
				continue;
			}

			for(var j=0; j<mutual.length; j++) {
				if(exclusive[i].equals(mutual[j]))
					toRemove.push(i);
			}
		}

		for (var i = toRemove.length-1; i >= 0; i--)
   			exclusive.splice(toRemove[i],1);

   		return exclusive;
	}

	GridBox.prototype.intersectingCells = function(nearby) {
		// If the object being passed in isn't another GridBox
		// return now (equivalent to null)
		if(!(nearby instanceof GridBox))
			return;

		// Not interested in mutual neighbours if this cell is hidden or 0
		if(!this.revealed || this.number === 0 ||
			!nearby.revealed || nearby.number === 0)
			return;

		// If it's that far apart we have no mutual neighbours
		if(Math.abs(this.xIndex - nearby.xIndex) > 2 || Math.abs(this.yIndex - nearby.yIndex) > 2)
			return;

		var intersection = [];

		// Comparing x1 to x3
		// I want 2

		// Comparing x2 to x3
		// I want 2 to 3

		// Comparing x2 to x2
		// I want 1 to 3

		// Start at max-1, run to min+1

		for(var i = Math.max(this.xIndex-1, nearby.xIndex-1, 0); i<= Math.min(this.xIndex+1, nearby.xIndex+1, difficulty.x-1); i++)
			for(var j = Math.max(this.yIndex-1, nearby.yIndex-1, 0); j<= Math.min(this.yIndex+1, nearby.yIndex+1, difficulty.y-1); j++)
				if(!gameGrid[i][j].revealed)
					intersection.push(gameGrid[i][j]);
		
		return intersection;
	}

	GridBox.prototype.toggleFlag = function() {
		// If we're removing a flag, decrement our counter
		if(this.isFlagged)
			totalFlagged--;
		else
			totalFlagged++;

		remainingMinesNumberBox.draw(difficulty.mines - totalFlagged);

		// Toggle flag state
		this.isFlagged = !this.isFlagged;
		this.draw();
	}

	GridBox.prototype.isMyNeighbour = function(nearby) {
		// If the object being passed in isn't another GridBox
		// return now (equivalent to null)
		if(!(nearby instanceof GridBox))
			return false;

		for(var i=0; i<this.neighbours.length; i++)
			if(this.neighbours[i].equals(nearby))
				return true;

		return false;
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

	var newGameButton;
	var autoPlayButton;
	var testButton;

	var remainingMinesNumberBox;
	var timeNumberBox;

	var totalFlagged;
	var totalUnrevealed;
	var totalTime;
	var clockTimer;

	// Get the canvas context
	var canvas = document.getElementById('skillSweeperCanvas');
	var ctx = canvas.getContext('2d');

	init();
	drawField();

	function hint() {
		if(skillDetect()) {
			// Create a list of all cells with known moves
			var allHints = [];

			for(var i=0;i<gameGrid.length;i++)
				for(var j=0;j<gameGrid[i].length;j++)
					if(gameGrid[i][j].skillSafe || gameGrid[i][j].skillFlag)
						allHints.push(gameGrid[i][j]);

			// Now we have a complete list of available moves, pick one randomly
			var i = Math.floor(Math.random() * allHints.length);

			// Show the cell with the hint
			allHints[i].drawCellButton(true);

			// Penalise the player
			timeNumberBox.draw("010");
		} else {
			alert("Sorry buddy, you're down to luck now!");
		}


	}

	function drawField() {
		for(var i=0;i<gameGrid.length;i++)
			for(var j=0;j<gameGrid[i].length;j++)
				gameGrid[i][j].draw();
	}

	function drawHeader() {
		header.offsetDrawingContext();
		ctx.fillStyle = "#2F5C11";
		ctx.fillRect(0, 0, header.width, header.height);
	}

	function initialiseCanvas() {
		// Disable double-clicks from selecting text outside the canvas
		// http://stackoverflow.com/a/3685462
		canvas.onselectstart = function () { return false; }

		var width = difficulty.x * CELL_SIZE;
		header = new Box(BORDER_SIZE, BORDER_SIZE, width, 50);
		field = new Box(BORDER_SIZE, header.height+(2*BORDER_SIZE), difficulty.x * CELL_SIZE, difficulty.y * CELL_SIZE);

		canvas.width = (2 * BORDER_SIZE) + field.width;
		canvas.height = field.yPos + field.height + BORDER_SIZE;

		newGameButton = new Button(2*BORDER_SIZE, 2*BORDER_SIZE, 90, 20, "New Game");
		autoPlayButton = new Button(2*BORDER_SIZE, 2*BORDER_SIZE + 20, 90, 20, "Autoplay");
		testButton = new Button(canvas.width - 90 - 2*BORDER_SIZE, 2*BORDER_SIZE, 90, 20, "Test");

		remainingMinesNumberBox = new NumberBox(110, 2*BORDER_SIZE + 5, 70, 30);
		timeNumberBox = new NumberBox(190, 2*BORDER_SIZE + 5, 70, 30);
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

		// Initialise the cell
		for(var i = 0; i < gameGrid.length; i++)
			for(var j=0; j<gameGrid[i].length; j++)
				gameGrid[i][j].init();
	}

	function drawCanvas() {
		ctx.fillStyle = "#000000";
		ctx.fillRect(0,0,canvas.width, canvas.height);

		drawHeader();
		drawField();
		drawButtons();

		remainingMinesNumberBox.draw("0");
		timeNumberBox.draw("0");
	}

	function drawButtons() {
		newGameButton.draw();
		autoPlayButton.draw();
		testButton.draw();
	}

	function mouseClickHandler(e) {
		e.preventDefault();

		if (!e.which && e.button) {
			if (e.button & 1) e.which = 1      // Left
			else if (e.button & 4) e.which = 2 // Middle
			else if (e.button & 2) e.which = 3 // Right
		}

		var canvasX = e.pageX - this.offsetLeft;
		var canvasY = e.pageY - this.offsetTop;

		// if click occurred inside field
		if((gameState === GAMESTATE_RUNNING || gameState === GAMESTATE_NEW) &&
			field.isClickInside(canvasX, canvasY)) {
			var xIndex = Math.floor((canvasX - field.xPos)/CELL_SIZE);
			var yIndex = Math.floor((canvasY - field.yPos)/CELL_SIZE);
			handleFieldClick(e, xIndex, yIndex);
			checkForWin();
		} else if(newGameButton.isClickInside(canvasX, canvasY)) {
			newGame();
		} else if(autoPlayButton.isClickInside(canvasX, canvasY)) {
			autoPlay(true);
		} else if(testButton.isClickInside(canvasX, canvasY)) {
			skillCrossReference();
		} else {
			hint();
		}
	}

	function checkForWin() {
		if(gameState != GAMESTATE_RUNNING)
			return;

		if(totalUnrevealed === difficulty.mines)
			gameWon();
	}

	function autoPlay(oneMoveAtATime) {
		gameState = GAMESTATE_AUTOPLAY;

		// Redraw the field to show the skillsafe/skill flag colored squares
		drawField();

		var timeInterval = 200;
		if(oneMoveAtATime)
			timeInterval = 10;

		var autoRunInterval = setInterval(function() {
			var v = autoMove(oneMoveAtATime);
			if(!v) {
				gameState = GAMESTATE_RUNNING;
				clearInterval(autoRunInterval);
				checkForWin();
			}
		}, timeInterval);
	}

	function autoMove(oneMoveAtATime) {
		// Stop automove if the user clicks a mine and dies
		if(gameState != GAMESTATE_AUTOPLAY)
			return false;

		for(var i = 0; i < gameGrid.length; i++) {
			for(var j=0; j<gameGrid[i].length; j++) {
				if(gameGrid[i][j].skillFlag) {
					gameGrid[i][j].toggleFlag();
					gameGrid[i][j].skillFlag = false;
					gameGrid[i][j].draw();

					if(oneMoveAtATime)
						return true;
				}

				if(gameGrid[i][j].skillSafe) {
					gameGrid[i][j].skillSafe = false;
					gameGrid[i][j].reveal();

					if(oneMoveAtATime)
						return true;
				}
			}
		}
		return skillDetect();
	}

	function skillDetect() {
		var anyMovesFound = false;

		for(var i = 0; i < gameGrid.length; i++) {
			for(var j=0; j<gameGrid[i].length; j++) {
				gameGrid[i][j].skillFlag = false;
				gameGrid[i][j].skillSafe = false;
				gameGrid[i][j].draw();
			}
		}

		for(var i = 0; i < gameGrid.length; i++) {
			for(var j=0; j<gameGrid[i].length; j++) {
				if(gameGrid[i][j].skillDetectFlag())
					anyMovesFound = true;

				if(gameGrid[i][j].skillDetectSafe())
					anyMovesFound = true;
			}
		}

		// Only do the advanced detection (cross-reference)
		// if there were no other moves detected
		// because it is computationally expensive

		if(!anyMovesFound)
			anyMovesFound = skillCrossReference();

		return anyMovesFound;
	}

	function skillCrossReference() {
		var anyFound = false;
		for(var i = 0; i < gameGrid.length; i++) {
			for(var j=0; j<gameGrid[i].length; j++) {
				if(gameGrid[i][j].skillCrossReferenceNearby())
					anyFound = true;
			}
		}
		return anyFound;
	}

	function handleFieldClick(e, x, y) {
		if(gameState === GAMESTATE_NEW) {
			placeMines(x, y);
			startGame();
		}

		if(gameGrid[x][y].revealed) {
			gameGrid[x][y].chord();
		} else {

			// If it was a left-click reveal the cell
			if(e.which === 1) {
				gameGrid[x][y].reveal();
			} else if (e.which === 3) {
				gameGrid[x][y].toggleFlag();
			}		
		}

		if(gameState === GAMESTATE_RUNNING)
			skillDetect();
	}

	function startClock() {
		clockTimer = setInterval(function() {
			totalTime++;
			timeNumberBox.draw(totalTime);

			if(totalTime >= 999)
				stopClock();
		}, 1000);
	}

	function stopClock() {
		clearInterval(clockTimer);
	}

	function clockTick() {

	}

	function gameWon() {
		gameState = GAMESTATE_WON;
		stopClock();
		alert("You won!");
		// highscore
	}

	function startGame() {
		gameState = GAMESTATE_RUNNING;
		startClock();
	}

	function hitMine() {
		gameState = GAMESTATE_DEAD;
		drawField();
		alert("You are dead!");
		// sad face sun
		// show message
		stopClock();
	}

	function registerListeners() {
		canvas.onclick = mouseClickHandler;
		canvas.oncontextmenu = mouseClickHandler;
	}

	function newGame() {
		totalFlagged = 0;
		totalUnrevealed = difficulty.x * difficulty.y;
		initialiseField();
		drawCanvas();
		remainingMinesNumberBox.draw(difficulty.mines - totalFlagged);
		gameState = GAMESTATE_NEW;
		totalTime = 0;
		// happy face sun
	}

	function init() {
		initialiseCanvas();
		registerListeners();
		newGame();
	}
})();