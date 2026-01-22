document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('sellerAcquisitionForm');
    const successMessage = document.getElementById('successMessage');

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Collect Form Data
            const formData = new FormData(form);
            const data = {};
            
            formData.forEach((value, key) => {
                data[key] = value;
            });
            
            // Log data to console as requested
            console.log('Seller Acquisition Form Submitted:', data);
            
            // UI Feedback
            const submitBtn = form.querySelector('.btn-submit');
            const originalBtnText = submitBtn.innerText;
            
            submitBtn.innerText = 'Submitting...';
            submitBtn.disabled = true;
            
            // Simulate Network Request
            setTimeout(() => {
                // Hide Form and Show Success Message
                form.style.display = 'none';
                successMessage.style.display = 'block';
                
                // Reset form
                form.reset();
                
                // Scroll to success message
                successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Reset button state (in case form is shown again later)
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
                
            }, 1000);
        });
    }
});
