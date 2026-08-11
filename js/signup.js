function togglePassword(fieldId) {
  // 1. select the password input by its id
  const input = document.getElementById(fieldId);

  // 2. check its current type
  if (input.type === "password") {
    // if it's hidden, show it
    input.type = "text";
  } else {
    // if it's shown, hide it again
    input.type = "password";
  }
}
