function togglePassword() {
  
  const input = document.getElementById("password");

  // 2. check its current type
  if (input.type === "password") {
    // if it's hidden show it
    input.type = "text";
  } else {
    // if it's shown hide it 
    input.type = "password";
  }
}
