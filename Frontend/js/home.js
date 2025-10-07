document.addEventListener('DOMContentLoaded', function() {
    const userData = localStorage.getItem('user');
            
    if (userData) {
        const user = JSON.parse(userData);
        document.getElementById('welcomeMessage').textContent = `Welcome, ${user.username}!`;
    } else {
        window.location.href = '../html/login.html';
    }
            
    const learningOptions = document.querySelectorAll('.learning-option');
            
    learningOptions.forEach(option => {
        option.addEventListener('click', function() {
            const checkbox = this.querySelector('.custom-checkbox');
            checkbox.classList.toggle('checked');
            this.classList.toggle('active');
        });
    });
            
    document.getElementById('confirmBtn').addEventListener('click', function() {
        const selectedOptions = [];
                
        learningOptions.forEach(option => {
            if (option.classList.contains('active')) {
                selectedOptions.push(option.getAttribute('data-option'));
            }
        });
                
        // if (selectedOptions.length > 0) {
        //     alert(`Learning preferences confirmed! Selected: ${selectedOptions.join(', ')}`);
        //     // Here you would typically send this data to your backend
        //     // For now, we'll just show an alert
        // } else {
        //     alert('Please select at least one learning option.');
        // }
    });
            
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('user');
        window.location.href = '../html/login.html';
    });
});