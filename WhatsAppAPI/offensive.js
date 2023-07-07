function checkOffensive(str) {
  const offensive=["fuck","bitch","hoe","*"]
  // Convert the string to lowercase to make the search case-insensitive
  str = str.toLowerCase();
  
  // Loop through the word list and check if any of the words are in the string
  for (var i = 0; i < offensive.length; i++) {
    var word = offensive[i].toLowerCase();
    if (str.includes(word)) {
      return true;
    }
  }
  
  // If none of the words are found, return false
  return false;
}

module.exports = checkOffensive;
