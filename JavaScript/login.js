/**
 * Legacy Login Adapter for backward compatibility
 */
async function checkSignUp() {
  const enteredUsername = document.getElementById('username').value;
  const enteredPassword = document.getElementById('password').value;

  if (window.apiService) {
    try {
      await window.apiService.login(enteredUsername, enteredPassword);
      window.location.href = "../index.html";
      return false;
    } catch (err) {
      alert(err.message || 'Incorrect username or password!');
      return false;
    }
  }

  // Fallback
  const userDataString = localStorage.getItem('userData');
  if (!userDataString) {
    alert('You need to sign up first!');
    return false;
  }
  const userData = JSON.parse(userDataString);
  if (enteredUsername === userData.username && enteredPassword === userData.password) {
    window.location.href = "../index.html";
  } else {
    alert('Incorrect username or password!');
  }
  return false;
}
