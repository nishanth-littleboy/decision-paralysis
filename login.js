function togglePassword() {
  const pass = document.getElementById("password");
  pass.type = pass.type === "password" ? "text" : "password";
}

function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const remember = document.getElementById("rememberMe").checked;
  const card = document.querySelector(".login-card");

  const storedEmail = localStorage.getItem("userEmail");
  const storedPassword = localStorage.getItem("userPassword");

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

  if (!storedEmail || !storedPassword) {
    triggerShake(card);
    alert("No account found. Please signup first.");
    return;
  }

  if (email === storedEmail && password === storedPassword) {
    localStorage.setItem("loggedIn", "true");

    if (remember) {
      localStorage.setItem("rememberEmail", email);
    } else {
      localStorage.removeItem("rememberEmail");
    }

    window.location.href = "index.html";
  } 
  else {
    triggerShake(card);
    alert("Incorrect email or password");
  }
}

function triggerShake(card) {
  card.classList.remove("shake");
  void card.offsetWidth;
  card.classList.add("shake");
}

window.onload = () => {
  const savedEmail = localStorage.getItem("rememberEmail");
  if (savedEmail) {
    document.getElementById("email").value = savedEmail;
  }
};
