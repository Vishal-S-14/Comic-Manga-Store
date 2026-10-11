/**
 * Legacy Signup Adapter for backward compatibility
 */
async function saveUserData() {
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const termsCheckbox = document.getElementById('terms');

  if (termsCheckbox && !termsCheckbox.checked) {
    alert('Please read and accept the Terms and Conditions.');
    return;
  }

  if (window.apiService) {
    try {
      await window.apiService.register(username, email, password);
      window.location.href = "index.html";
      return;
    } catch (err) {
      alert(err.message || 'Failed to create account');
      return;
    }
  }

  // Fallback
  const userData = { username, email, password };
  localStorage.setItem('userData', JSON.stringify(userData));
  window.location.href = "index.html";
}
