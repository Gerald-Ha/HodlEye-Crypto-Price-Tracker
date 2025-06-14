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
            window.location.href = response.url; 
        }
    }).catch(error => console.error("Logout error:", error));
}