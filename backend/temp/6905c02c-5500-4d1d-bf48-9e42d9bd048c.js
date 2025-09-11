// Reads all input from STDIN, trims it, and prints something.
// Edit "solve" to implement the required logic.
const fs = require('fs');
function solve(input) {
  // TODO: implement
  return input; // echo
}
const input = fs.readFileSync(0, 'utf8').trim();
const output = solve(input);
if (output !== undefined) console.log(output);