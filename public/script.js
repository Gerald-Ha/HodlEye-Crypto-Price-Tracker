
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(event) {
      
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
  



  function logout() {
    fetch("/logout", {
        method: "GET",
        credentials: "same-origin"
    }).then(response => {
        if (response.redirected) {
            window.location.href = response.url; // Leitet zur Login-Seite um
        }
    }).catch(error => console.error("Logout-Fehler:", error));
}