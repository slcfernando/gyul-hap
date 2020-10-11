"use strict";

const BACKGROUND_COLORS = {
    white: "#FFF",
    gray: "#9C9C96",
    black: "#353531"
};

const SHAPE_COLORS = {
    red: "#C81D25", 
    blue: "#016FB9", 
    yellow: "#FDE935"
};

const SHAPES = {
    square: {
        height: "60%",
        width: "60%"
    },
    circle: {
        height: "66%",
        width: "66%",
        borderRadius: "50%"
    },
    triangle: {
        width: "35px",
        height: "35px",
        borderLeft: "35px solid transparent",
        borderRight: "35px solid transparent",
        borderBottom: "70px solid "
    }
};

const BORDER_BLACK = "rgb(0, 0, 0)";
const BORDER_RED = "rgb(237, 49, 93)";

const scoreElement = document.getElementById("score");

/*
tileBoard
Index - Corresponding Tile
0 - top left
1 - top center
2 - top right
3 - middle left
4 - middle center
5 - middle right
6 - bottom left
7 - bottom center
8 - bottom right

Each tile is an array that contains at index:
0 - backgroundColor
1 - shapeColor
2 - shapeStyles
3 - shape
4 - if the tile is selected (default false)
*/
let tileBoard = [];

// Set round number.
let roundNumber = 1;

// Set total points in the game.
let totalPoints = 0;

// Allows player to select tiles in the game (up to 3).
let tilesSelected = 0;

// Contains all Haps on the board and all found Haps.
let allHaps;
let foundHaps;

// Make all tiles clickable to select them.
makeTilesSelectable();

// Create the board and start the round.
playRound();

// Make the Gyul button clickable.
const gyulButton = document.querySelector(".gyul");
gyulButton.addEventListener("click", checkForGyul);

function playRound() {
    tileBoard = [];
    foundHaps = [];
    const allTiles = document.querySelectorAll(".tile");
    const allShapes = document.querySelectorAll(".shape");

    for (let i = 0; i < allTiles.length; i++) {
        let currentTile = allTiles[i];
        let currentShape = allShapes[i];

        // Reset tile styles to blank first.
        currentTile.removeAttribute('style');
        currentShape.removeAttribute('style');

        // Make sure tile styles don't repeat.
        let styles;
        do {
            styles = createTile();
        } while (checkTileExists(styles));

        applyTileStyles(currentTile, currentShape, styles);
        tileBoard.push(styles);
    }

    // Find all Haps on the board.
    allHaps = findAllHaps();
};

function applyTileStyles(tile, shape, cssStyles) {
    // Apply tile background color.
    tile.style.backgroundColor = BACKGROUND_COLORS[cssStyles[0]];

    // Apply shape color.
    const isTriangle = cssStyles[3] == "triangle";
    if (isTriangle) {
        shape.style.backgroundColor = "transparent";
    } else {
        shape.style.backgroundColor = SHAPE_COLORS[cssStyles[1]];
    }

    // Apply shape.
    for (let cssStyle in cssStyles[2]) {
        shape.style[cssStyle] = cssStyles[2][cssStyle];
    }
};

function createTile() {
    // Get background color.
    let backgroundColor = getRandomFromArray(Object.keys(BACKGROUND_COLORS));

    // Get shape color.
    let shapeColor = getRandomFromArray(Object.keys(SHAPE_COLORS));
    
    // Get shape.
    let shape = getRandomFromArray(Object.keys(SHAPES));
    let shapeStyles = SHAPES[shape];
    if (shape == "triangle") {
        shapeStyles = Object.assign({}, shapeStyles);
        shapeStyles.borderBottom += SHAPE_COLORS[shapeColor];
    }

    return [backgroundColor, shapeColor, shapeStyles, shape, false];
};

function checkTileExists(tileToCheck) {
    for (let i = 0; i < tileBoard.length; i++) {
        if (checkTilesAreEqual(tileBoard[i], tileToCheck)) {
            return true;
        }
    }
    return false;
};

function checkTilesAreEqual(tile1, tile2) {
    if (tile1[0] == tile2[0] &&
        tile1[1] == tile2[1] &&
        tile1[3] == tile2[3]) {
        return true;
    }
    return false;
};

function makeTilesSelectable() {
    const allTiles = document.querySelectorAll(".tile");

    for (let i = 0; i < allTiles.length; i++) {
        let currentTile = allTiles[i];

        currentTile.addEventListener("click", function() {
            let tileIsSelected = tileBoard[i][4];

            if (!tileIsSelected) {
                tilesSelected++;
                currentTile.style.borderColor = BORDER_RED;
                tileBoard[i][4] = true;
            } else {
                if (tilesSelected != 0) {
                    tilesSelected--;
                }
                currentTile.style.borderColor = BORDER_BLACK;
                tileBoard[i][4] = false;
            }

            // console.log(`CLICKED!: ${tileBoard[i]}`);

            checkThreeTilesSelected();
        });
    }
}

function checkThreeTilesSelected() {
    if (tilesSelected == 3) {
        // Check if a Hap was formed by the player.
        let selectedTileIndexes = "";
        let selectedTiles = [];
        for (let i = 0; i < tileBoard.length; i++) {
            let tileIsSelected = tileBoard[i][4];
            if (tileIsSelected) {
                selectedTiles.push(tileBoard[i]);
                selectedTileIndexes += i.toString();
            }
        }
        let hap = checkForHap(selectedTiles);
        if (hap && !foundHaps.includes(selectedTileIndexes)) {
            console.log("Correct Hap +1")
            updateScore(1);
            foundHaps.push(selectedTileIndexes);
        } else {
            console.log("Wrong Hap -1")
            updateScore(-1);
        }

        // Reset all tiles so nothing is selected.
        tilesSelected = 0;
        for (let i = 0; i < tileBoard.length; i++) {
            tileBoard[i][4] = false;
        }

        // Set short delay before returning tiles to normal size.
        setTimeout(function() {
            const allTiles = document.querySelectorAll(".tile");
            for (let i = 0; i < allTiles.length; i++) {
                let currentTile = allTiles[i];
                currentTile.style.borderColor = BORDER_BLACK;
            }; 
        }, 500);
    }
}

function checkForHap(selectedTiles) {
    let backgroundColors = [];
    let shapeColors = [];
    let shapes = [];
    for (let i = 0; i < selectedTiles.length; i++) {
        backgroundColors.push(selectedTiles[i][0]);
        shapeColors.push(selectedTiles[i][1]);
        shapes.push(selectedTiles[i][3]);
        // console.log(selectedTiles[i]);
    }

    // Check background colors if all same or all different.
    let backgroundColorHap = (allSame(backgroundColors) || allDifferent(backgroundColors));
    // console.log(`backgroundColorHap: ${backgroundColorHap}`);

    // Check shape colors if all same or all different.
    let shapeColorHap = (allSame(shapeColors) || allDifferent(shapeColors));
    // console.log(`shapeColorHap: ${shapeColorHap}`);

    // Check shapes if all same or all different.
    let shapeHap = (allSame(shapes) || allDifferent(shapes));
    // console.log(`shapeHap: ${shapeHap}`);

    // Check if a Hap was formed.
    if ((backgroundColorHap && shapeColorHap) && shapeHap) {
        // console.log("Hap!");
        return true;
    } else {
        // console.log("Not Hap!");
        return false;
    }
}

function findAllHaps() {
    const allHaps = [];
    let numOfTiles = tileBoard.length;

    console.log(`Hap solutions for round ${roundNumber}:`);
    for (let i = 0; i < numOfTiles-2; i++) {
        for (let j = i+1; j < numOfTiles-1; j++) {
            for (let k = j+1; k < numOfTiles; k++) {
                let tile1 = tileBoard[i];
                let tile2 = tileBoard[j];
                let tile3 = tileBoard[k];
                if (checkForHap([tile1, tile2, tile3])) {
                    console.log(`Hap Found: ${i+1} ${j+1} ${k+1}`);
                    allHaps.push(i.toString() + j.toString() + k.toString());
                }
            }
        }
    }

    return allHaps;
}

function checkForGyul() {
    if (foundHaps.length == allHaps.length) {
        console.log("Gyul! +3");
        updateScore(3);
        roundNumber++;
        playRound();
    } else {
        console.log("Not Gyul! -1");
        updateScore(-1);
    }
}

function updateScore(points) {
    totalPoints += points;
    scoreElement.innerText = totalPoints;
    console.log(`Current score: ${totalPoints}`)
};

function allSame(arr) {
    return arr.every(elem => elem === arr[0]);
}

function allDifferent(arr) {
    return arr.length === new Set(arr).size;
}

function getRandomFromArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}