<script lang="ts">
  import { goto } from '$app/navigation';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let error = '';
  let loading = false;

  async function handleSignup() {
    // Password validation
    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }
    
    loading = true;
    error = '';
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, mode: 'signup' })
      });
      const data = await res.json();
      if (!res.ok) {
        error = data.error ?? 'Signup failed';
        return;
      }
      // on success, go to login
      location.href = '/';
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="auth-container">
  <div class="auth-card">
    <h1>Create Account</h1>
    <p class="subtitle">Sign up to start managing your inventory</p>
    
    {#if error}
      <div class="error-message">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        {error}
      </div>
    {/if}
    
    <form on:submit|preventDefault={handleSignup}>
      <div class="form-group">
        <label for="email">Email</label>
        <input id="email" type="email" bind:value={email} required placeholder="youremail@example.com" />
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input id="password" type="password" bind:value={password} required minlength="6" 
          placeholder="Min. 6 characters" />
        <p class="input-hint">Use at least 6 characters with a mix of letters and numbers</p>
      </div>
      
      <div class="form-group">
        <label for="confirm-password">Confirm Password</label>
        <input id="confirm-password" type="password" bind:value={confirmPassword} required minlength="6" 
          placeholder="Re-enter your password" />
      </div>
      
      <button type="submit" class="btn-primary" disabled={loading}>
        {#if loading}
          <span class="loader"></span>
        {:else}
          Create Account
        {/if}
      </button>
    </form>
    
    <div class="auth-footer">
      <p>
        Already have an account?
        <a href="/" class="link">Log in</a>
      </p>
    </div>
  </div>
</div>

<style>
  .auth-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 2rem;
    background-color: #f9fafb;
  }
  
  .auth-card {
    width: 100%;
    max-width: 450px;
    padding: 2.5rem;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  h1 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 600;
    color: #111827;
    text-align: center;
  }
  
  .subtitle {
    margin-top: 0.5rem;
    color: #6b7280;
    text-align: center;
    margin-bottom: 1.5rem;
  }
  
  .form-group {
    margin-bottom: 1.25rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
  }
  
  input {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    color: #111827;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    transition: border-color 0.15s ease-in-out;
  }
  
  input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .input-hint {
    margin-top: 0.375rem;
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  .btn-primary {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding: 0.75rem 1.5rem;
    margin-top: 1rem;
    color: white;
    font-weight: 500;
    background-color: #4f46e5;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.15s ease-in-out;
  }
  
  .btn-primary:hover {
    background-color: #4338ca;
  }
  
  .btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    margin-bottom: 1.25rem;
    color: #b91c1c;
    background-color: #fee2e2;
    border-radius: 6px;
  }
  
  .auth-footer {
    margin-top: 1.5rem;
    text-align: center;
    color: #6b7280;
  }
  
  .link {
    color: #4f46e5;
    font-weight: 500;
    text-decoration: none;
  }
  
  .link:hover {
    text-decoration: underline;
  }
  
  .loader {
    width: a1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.8s ease-in-out infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>