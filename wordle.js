"use strict";


const HEIGHT = 8;
const WIDTH = 7;
const CLUE_MAX= 3;
let current = null;

let row = 0;  // current guess (attempt no.)
let col = 0; // current letter position in current attempt

let gameWon = false;
let gameOver = false;
let word = "ANIMALI";

const data = {
    start: 0,
    end: word.length,
    array: Array.from({ length: word.length }, () => false),
    correct: 0
};


const clue = {
    count : 0,
    valid : 0,
};

class Character {
    constructor(index, char) {
        this.index = index;
        this.char = char;
    }
}

class Current {
    constructor() {
        this.toSort = false;
        this.charMap = new Map();
        this.available = [];
        this.unavailable = new Set();
        this.pool = [];
    }
}

function clear() {
    for (let i = 0; i < word.length; i++) {
        let tile = document.getElementById((row + 1).toString() + "-" + i.toString());
        tile.classList.remove("correct");
        tile.innerText = " ";
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function initialize() {
    // create the game board
    for (let r = 0; r < HEIGHT; r++) {
        for (let c = 0; c < WIDTH; c++) {
            let tile = document.createElement("span");
            tile.id = r.toString() + "-" + c.toString();
            tile.classList.add("tile");
            tile.innerText = "";
            document.getElementById("board").appendChild(tile);
        }
    }
    // Listen for key Press
    document.addEventListener("keyup", keyPress);
}

function postValidate() {

    if (data.correct === word.length) {
        gameWon = gameOver = true;
        if (row < HEIGHT-1) clear();
        return;
    }
    row++;

    if (row === HEIGHT) {
        gameOver = true;
        return;
    }

    col = data.start;

}

function clueSort() {
    let sortedArray = [...current.charMap.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]));
    let charArray = [];
    for (let i = 0; i < sortedArray.length; i++) {
        let currChar = sortedArray[i][0];
        let charTotal = sortedArray[i][1];

        for (let j = 0; j < current.pool.length; j++) {
            if (current.pool[j] === null) continue;
            let poolChar = current.pool[j].char
            if (poolChar === currChar) {
                charArray.push(current.pool[j])
                current.pool[j] = null;
                charTotal--;
                if (charTotal === 0) break;

            }
        }
    }
    current.pool = charArray;
}

function clueExecute() {
    if (current.toSort) {
        clueSort();
    }
    // 1) default fill all blocks black
    for (let i = 0; i < WIDTH; i++) {
        let aboveTile = document.getElementById((row-1).toString() + "-" + i.toString());
        let currTile = document.getElementById(row.toString() + "-" + i.toString());
        if (data.array[i]) {
            currTile.innerText = aboveTile.innerText;
            currTile.classList.add("correct");
            if (row < HEIGHT-1) {
                let belowTile = document.getElementById((row+1).toString() + "-" + i.toString());
                belowTile.innerText = aboveTile.innerText;
                belowTile.classList.add("correct");
            }
        } else {
            currTile.classList.add("black");
        }
    }
    // 2) iterate through each yellow character
    current.pool.forEach( (characterObj) => {
        let availableIndex;

        // 2a) find if there's a valid available spot
        // shuffle array to make available random
        if (current.available.length > 0) {
            shuffleArray(current.available);
        }

        for (let i = 0; i < current.available.length; i++) {
            if (word[current.available[i]] !== characterObj.char && !current.unavailable.has(current.available[i])) {
                availableIndex = current.available[i];
                current.unavailable.add(current.available[i]);
                break;
            }
        }
        // 2b) if no available spot, try to make one
        if (!availableIndex) {
            for (let i = 0; i < current.pool.length; i++) {
                if (current.pool[i].index !== characterObj.index &&
                    characterObj.char !== current.pool[i].char &&
                    word[current.pool[i].index] !== characterObj.char &&
                    !current.unavailable.has(current.pool[i].index)) {
                    availableIndex = current.pool[i].index;
                    current.unavailable.add(current.pool[i].index)
                    break;
                }
            }
        }

        if (availableIndex) {
            let tile = document.getElementById(row.toString() + "-" + availableIndex.toString());
            tile.classList.remove("black");
            tile.classList.add("present");
            tile.innerText = characterObj.char;
        }
    });


    clue.count++;
    clue.valid = -1;
    row++;
    document.getElementById("clueButton").innerText = "clue: ❌";
    return "Clue used!";
}

function keyPress(e) {

    if (gameOver) return;

    if (e.code === "Enter" && col === data.end) {
        validate();
        if (gameOver) {
            let textGameOver = document.getElementById("message");
            textGameOver.innerText = gameWon ? "You Win!" : "You Lose.";
            textGameOver.classList.add("fade-in-up");

        }
    } else if (e.code === "Space") {
        let textSpace = document.getElementById("message");
        textSpace.innerText = clue.count === CLUE_MAX ? "No clues left!" :
                              clue.valid === 0 ? "No yellow blocks present!" :
                              clue.valid === -1 ? "Clue already used!" :
                              clueExecute();

        textSpace.classList.add("fade-in-out");

        setTimeout(() => {
            textSpace.remove();
            let resetTextSpace = document.createElement("h2");
            resetTextSpace.id = "message";
            document.body.appendChild(resetTextSpace);
        }, 3000);

    } else if (col > data.start && e.code === "Backspace") {
        col--;
        let currTile = document.getElementById(row.toString() + "-" + col.toString())
        while (data.array[col] === true && col > data.start) {
            col--;
            currTile = document.getElementById(row.toString() + "-" + col.toString());
        }
        currTile.innerText = " ";


    } else if ( col < data.end && e.code >= "KeyA" && e.code <= "KeyZ" ) {
        let currTile = document.getElementById(row.toString() + "-" + col.toString())
        while (data.array[col] === true && col < data.end) {
            col++;
            currTile = document.getElementById(row.toString() + "-" + col.toString());
        }
        currTile.innerText = e.code[3];
        col++;

    }

}

function findPosition(direction, i) {

    while (data.array[i]) {
        direction === "start" ? i++ : i--;
    }

    data[direction] = direction === "start" ? i : ++i;

}

function validate() {
    let wordMap = createWordMap();
    //sweep 1) first check for correct/incorrect guesses
    for (let i = 0; i < word.length; i++) {
        let tile = document.getElementById(row.toString() + "-" + i.toString());
        let guessChar = tile.innerText;
        let answerChar = word[i];
        if (guessChar === answerChar) {
            wordMap.set(guessChar, wordMap.get(guessChar) - 1);
            tile.classList.add("correct");
            if (row < HEIGHT-1) {
                let belowTile = document.getElementById((row+1).toString() + "-" + i.toString());
                belowTile.classList.add("correct");
                belowTile.innerText = answerChar;
            }

            if (!data.array[i]) {
                data.array[i] = true;
                data.correct++;
                if (i === data.start) findPosition("start", i);
                else if (data.correct < word.length && i === data.end - 1) findPosition("end", i); //TODO: when data.start & data.end meet, then that could be the indicator for game over
            }

        } else {
            tile.classList.add("absent");
        }
    }
    current = new Current();  // create current object to store yellow & grey data

    //sweep 2) now check for all guesses that are 'present but in diff. position'
    clue.valid = 0;
    document.getElementById("clueButton").innerText = "clue: ❌";
    for (let i = data.start; i < data.end; i++) {
        let tile = document.getElementById(row.toString() + "-" + i.toString());
        let guessChar = tile.innerText;
        let answerChar = word[i];
        if (guessChar !== answerChar && wordMap.has(guessChar) && wordMap.get(guessChar) > 0) {
            setCharinMap(tile.innerText, current.charMap);
            if (!current.toSort && current.charMap.get(tile.innerText) > 1) current.toSort = true;
            tile.classList.remove("absent")
            tile.classList.add("present");
            wordMap.set(guessChar, wordMap.get(guessChar) - 1);
            current.pool.push(new Character(i, guessChar));
            clue.valid = 1;
            if (clue.count < CLUE_MAX) {
                document.getElementById("clueButton").innerText = "clue: ✅";
            }
        } else if (guessChar !== answerChar && !wordMap.has(guessChar)) {
            current.available.push(i);

        }
    }
    postValidate();
}

function setCharinMap(char, argMap) {
    if ( !(argMap.has(char)) ) {
        argMap.set(char, 1);
    } else {
        argMap.set(char, argMap.get(char) + 1);
}

}

function createWordMap() {
    let wordMap = new Map();
    for (let i= 0; i < word.length; i++) {
        let char= word[i];
        setCharinMap(char, wordMap);
    }
    return wordMap;

}

window.onload = initialize;