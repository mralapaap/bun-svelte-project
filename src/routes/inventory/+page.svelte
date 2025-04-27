<script lang="ts">
  import { onMount } from 'svelte';
  import { formatPrice } from '$lib';

  // --- AI Insights State ---
  let summary = '';
  let summaryError = '';
  let isSummaryLoading = false;

  async function loadSummary() {
    summary = '';
    summaryError = '';
    isSummaryLoading = true;
    try {
      const res = await fetch('/api/summary');
      if (!res.ok) {
        summaryError = 'Failed to generate insights.';
      } else {
        const data = await res.json();
        summary = data.summary;
      }
    } catch {
      summaryError = 'Network error while generating insights.';
    } finally {
      isSummaryLoading = false;
    }
  }

  // --- Inventory State & Functions ---
  let name = '';
  let quantity: number = 0;
  let priceInput: string = '';    // <-- switched to string
  let description = '';
  let formError = '';
  let formSuccess = '';
  let isSubmitting = false;

  type Item = { id: number; name: string; quantity: number; price: number; description?: string };
  let items: Item[] = [];
  let error = '';
  let editingItem: Item | null = null;
  let isLoading = true;

  async function loadItems() {
    isLoading = true;
    try {
      const res = await fetch('/api/items');
      if (res.ok) items = await res.json();
      else error = 'Could not load items.';
    } catch {
      error = 'Network error while loading items.';
    } finally {
      isLoading = false;
    }
  }

  async function addItem() {
    formError = '';
    formSuccess = '';
    isSubmitting = true;

    const priceVal = parseFloat(priceInput);
    if (isNaN(priceVal)) {
      formError = 'Please enter a valid price.';
      isSubmitting = false;
      return;
    }
    const price = Math.round(priceVal * 100);

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, quantity, price, description })
      });
      if (!res.ok) {
        const data = await res.json();
        formError = data.error ?? 'Failed to add item';
        return;
      }
      formSuccess = `${name} has been added`;
      name = ''; quantity = 0; priceInput = ''; description = '';
      await loadItems();
    } catch {
      formError = 'Network error. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }

  async function updateItem() {
    if (!editingItem) return;
    formError = '';
    isSubmitting = true;

    const priceVal = parseFloat(priceInput);
    if (isNaN(priceVal)) {
      formError = 'Please enter a valid price.';
      isSubmitting = false;
      return;
    }
    const price = Math.round(priceVal * 100);

    try {
      const res = await fetch('/api/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem.id,
          name,
          quantity,
          price,
          description
        })
      });
      if (!res.ok) {
        const data = await res.json();
        formError = data.error ?? 'Failed to update item';
        return;
      }
      formSuccess = `${name} has been updated`;
      name = ''; quantity = 0; priceInput = ''; description = '';
      editingItem = null;
      await loadItems();
    } catch {
      formError = 'Network error. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }

  function editItem(item: Item) {
    editingItem = item;
    name = item.name;
    quantity = item.quantity;
    priceInput = (item.price / 100).toFixed(2); // <-- fill input with peso value
    description = item.description ?? '';
    document.getElementById('item-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  function cancelEdit() {
    editingItem = null;
    name = ''; quantity = 0; priceInput = ''; description = '';
    formError = '';
  }

  async function deleteItem(id: number, itemName: string) {
    if (!confirm(`Delete ${itemName}?`)) return;
    try {
      const res = await fetch('/api/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) {
        const data = await res.json();
        error = data.error ?? 'Failed to delete item.';
      } else {
        formSuccess = `${itemName} deleted`;
        await loadItems();
      }
    } catch {
      error = 'Network error. Please try again.';
    }
  }

  onMount(loadItems);
</script>

{#if isLoading}
  <div class="loading-container">
    <div class="loader" aria-label="Loading"></div>
    <p>Loading inventory...</p>
  </div>
{:else}
  <div class="app-container">
    <header class="app-header">
      <h1>Inventory Management</h1>
    </header>

    <main class="app-main">
      <!-- Generate Insights Button -->
      <section class="card">
        <h2>Inventory Insights</h2>
        <button
          class="btn-primary generate-insights-btn"
          on:click={loadSummary}
          disabled={isSummaryLoading}
        >
          {isSummaryLoading ? 'Generating...' : 'Generate Insights'}
        </button>
        {#if summaryError}
          <div class="error-banner" role="alert">{summaryError}</div>
        {:else if summary}
          <p>{summary}</p>
        {/if}
      </section>

      {#if error}
        <div class="error-banner" role="alert">{error}</div>
      {/if}

      {#if formSuccess}
        <div class="success-message">{formSuccess}</div>
      {/if}

      <!-- Add/Edit Form -->
      <section class="card" id="item-form">
        <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
        {#if formError}
          <div class="form-error" role="alert">{formError}</div>
        {/if}
        <form on:submit|preventDefault={editingItem ? updateItem : addItem} class="item-form">
          <div class="form-row">
            <div class="form-group">
              <label for="name">Item Name</label>
              <input id="name" bind:value={name} required placeholder="Product name" />
            </div>
            <div class="form-group">
              <label for="quantity">Quantity</label>
              <input id="quantity" type="number" bind:value={quantity} min="0" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="price">Price (₱)</label>
              <div class="price-input">
                <span aria-hidden="true">₱</span>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  bind:value={priceInput}
                  min="0"
                  required
                />
              </div>
            </div>
            <div class="form-group">
              <label for="description">Description (Optional)</label>
              <input id="description" bind:value={description} placeholder="Brief description" />
            </div>
          </div>
          <div class="form-actions">
            {#if editingItem}
              <button type="button" class="btn-secondary" on:click={cancelEdit}>Cancel</button>
              <button type="submit" class="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Updating…' : 'Update Item'}
              </button>
            {:else}
              <button type="submit" class="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Adding…' : 'Add Item'}
              </button>
            {/if}
          </div>
        </form>
      </section>

      <!-- Current Inventory Table -->
      <section class="card">
        <h2>Current Inventory</h2>
        {#if items.length === 0}
          <p>No items in inventory yet.</p>
        {:else}
          <table class="items-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each items as it (it.id)}
                <tr>
                  <td>{it.name}</td>
                  <td>{it.quantity}</td>
                  <td>{formatPrice(it.price)}</td>
                  <td>{it.description || '—'}</td>
                  <td class="actions-cell">
                    <button on:click={() => editItem(it)} aria-label="Edit item">✏️</button>
                    <button on:click={() => deleteItem(it.id, it.name)} aria-label="Delete item">🗑️</button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </section>
    </main>

    <footer class="app-footer">
      <p>© {new Date().getFullYear()} Inventory Management System</p>
    </footer>
  </div>
{/if}


<style>
  /* Global styles */
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    background-color: #f9fafb;
    color: #1f2937;
  }
  
  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  .loading-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #6b7280;
  }
  
  /* Header */
  .app-header {
    background-color: #4f46e5;
    color: white;
    padding: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .app-header h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  .user-menu {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .btn-logout {
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: background-color 0.15s ease-in-out;
  }
  
  .btn-logout:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
  
  /* Main content */
  .app-main {
    flex: 1;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
  
  .card {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 2rem;
  }
  
  h2 {
    margin-top: 0;
    margin-bottom: 1.25rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
  }
  
  /* Form */
  .item-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .form-row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .form-group {
    flex: 1;
    min-width: 200px;
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
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
  
  .price-input {
    position: relative;
  }
  
  .price-input span {
    position: absolute;
    left: 0.75rem;
    top: 0.75rem;
    color: #6b7280;
  }
  
  .price-input input {
    padding-left: 1.5rem;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 0.5rem;
  }
  
  .btn-primary {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0.75rem 1.5rem;
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
  
  .btn-secondary {
    padding: 0.75rem 1.5rem;
    color: #4b5563;
    font-weight: 500;
    background-color: #f9fafb;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.15s ease-in-out;
  }
  
  .btn-secondary:hover {
    background-color: #f3f4f6;
  }
  
  /* Table */
  .table-container {
    overflow-x: auto;
  }
  
  .items-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }
  
  .items-table th {
    padding: 0.75rem;
    font-weight: 500;
    color: #4b5563;
    background-color: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .items-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .items-table tr:last-child td {
    border-bottom: none;
  }
  
  .actions-cell {
    display: flex;
    gap: 0.5rem;
  }
  
  .btn-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0.375rem;
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    color: #4b5563;
    cursor: pointer;
    transition: background-color 0.15s ease-in-out;
  }
  
  .btn-icon:hover {
    background-color: #f3f4f6;
  }
  
  .btn-icon.delete {
    color: #ef4444;
  }
  
  .btn-icon.delete:hover {
    background-color: #fee2e2;
    border-color: #fecaca;
  }
  
  /* Messages */
  .error-banner, .form-error, .success-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    margin-bottom: 1.25rem;
    border-radius: 6px;
  }
  
  .error-banner, .form-error {
    color: #b91c1c;
    background-color: #fee2e2;
  }
  
  .success-message {
    color: #15803d;
    background-color: #dcfce7;
  }
  
  /* Empty state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 0;
    color: #6b7280;
  }
  
  .empty-state svg {
    color: #9ca3af;
    margin-bottom: 1rem;
  }
  
  .empty-state p {
    margin: 0.25rem 0;
  }
  
  /* Footer */
  .app-footer {
    padding: 1.5rem;
    text-align: center;
    color: #6b7280;
    border-top: 1px solid #e5e7eb;
  }
  
  .app-footer p {
    margin: 0;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .form-row {
      flex-direction: column;
      gap: 1rem;
    }
    
    .form-group {
      width: 100%;
    }
  }
  
  /* Loader */
  .loader {
    width: 1rem;
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