document.addEventListener("DOMContentLoaded", function () {

    const toggleLinks = document.querySelectorAll(".toggle");
    toggleLinks.forEach(function (link) {
        link.addEventListener("click", toggleForm);
    });

});

function toggleForm() {
  const loginForm = document.getElementById("login-box");
  const signupForm = document.getElementById("register-box");

  if (loginForm.style.display === "none") {
    loginForm.style.display = "block";
    signupForm.style.display = "none";
  } else {
    loginForm.style.display = "none";
    signupForm.style.display = "block";
  }
}