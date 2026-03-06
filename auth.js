function signup() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const card = document.querySelector(".login-card");

  if (!email && !password) {
    triggerShake(card);
    alert("Please fill the email and password");
    return;
  }

  if (!email) {
    triggerShake(card);
    alert("Please fill the email");
    return;
  }

  if (!password) {
    triggerShake(card);
    alert("Please fill the password");
    return;
  }

  localStorage.setItem("userEmail", email);
  localStorage.setItem("userPassword", password);

  // Redirect to login page (don't log them in automatically)
  window.location.href = "login.html";
}

function triggerShake(card) {
  card.classList.remove("shake");
  void card.offsetWidth; 
  card.classList.add("shake");
}
