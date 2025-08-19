# **A Word Strategy Game of Territory and Capture**

## **Overview**

A two-player game combining the strategic depth of Go with the linguistic creativity of Scrabble. Players take turns forming words on a 19x19 board to earn points and capture territory.

## **Objective**

Score the highest number of points by:

* Forming valid words on the board (word score)  
* Capturing your opponent’s tiles through strategic encirclement (tile capture)

## **Components**

* 19x19 game board populated with randomly generated letters per game  
* Two sets of tiles (Black and White), one for each player  
* A valid dictionary for word verification (e.g., Scrabble dictionary)  
* Game software to validate moves and track scores

## **Setup**

* Each game begins with a freshly generated 19x19 board of letters.  
* The distribution is based on common letter frequency, and may include pre-baked eight-letter words for bonus opportunities.  
* Players are assigned either White or Black tiles.  
* The central square of the board must be part of the first move.

## **Gameplay**

### **Starting the Game**

* Player 1 begins by forming a word using contiguous tiles (touching on sides or corners).  
* The word must be at least two letters long and must include the center square.  
* Words can be placed in any direction (horizontally, vertically, or diagonally).  
* Player 2 then makes their move, and players alternate turns.

### **Forming Words**

* On a turn, a player must place a new word on the board using available letters.  
* Words must be valid as determined by the shared dictionary. The system will automatically verify validity.  
* Words do not need to connect to existing words unless used to break an encirclement.  
* Multiple words may exist independently on the board.

## **Scoring**

### **Word Score**

Points are awarded based on the length of each valid word:

| Word Length | Points |
| :---- | :---- |
| 2 Letters | 2 Points |
| 3 Letters | 3 Points |
| 4 Letters | 4 Points |
| 5 Letters | 6 Points |
| 6 Letters | 8 Points |
| 7 Letters | 11 Points |
| 8 Letters | 14 Points |
| 9 Letters | 19 Points |
| 10 Letters | 24 Points |
| 11+ Letters | 30 Points |

### **Capture Score**

* When a player successfully encircles a group of their opponent’s tiles, those tiles are captured.  
* Each captured tile adds 1 point to the capturing player’s score.  
* A tile can only be captured once; it cannot be part of multiple encirclements.

## **Encirclement Rules**

A group of tiles is considered encircled and captured if:

1. The opponent’s tiles are completely surrounded by the current player’s tiles.  
2. The surrounded player cannot make a legitimate contiguous move (side-touching only; corner-touching doesn’t count).  
3. There are no valid words possible inside the encircled area.  
4. Encirclement is also valid if:  
   1. The opponent is blocked against a single edge of the board and surrounded on all other sides.  
   2. However, if they touch more than one edge, it's not considered encircled.

The game will automatically detect and indicate when an encirclement occurs, and display how many tiles have been captured.

## **End of Game**

The game ends when:

* No valid moves remain for either player, or  
* A player resigns

### 

### **Winning**

The player with the highest combined score wins. The total score is:

* Word Score (sum of all valid words created)  
* Capture Score (number of opponent tiles captured)