
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(event) {
      
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
  