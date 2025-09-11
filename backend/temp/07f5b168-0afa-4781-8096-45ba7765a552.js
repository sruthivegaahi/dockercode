function reverseString(str) {
  if (str === null || str === undefined) return str; // handle null/undefined
  let reversed = '';
  for (let i = str.length - 1; i >= 0; i--) {
    reversed += str[i];
  }
  return reversed;
}

// Test cases
console.log(reverseString("Hello World"));   // "dlroW olleH"
console.log(reverseString(""));              // ""
console.log(reverseString("A"));             // "A"
console.log(reverseString("12345"));         // "54321"
console.log(reverseString("!@#$%^&*()"));    // ")(*&^%$#@!"
console.log(reverseString(" "));             // " "
console.log(reverseString(null));            // null
console.log(reverseString(undefined));       // undefined
