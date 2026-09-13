/** Consent-gated events contain no form data, identifiers, query strings or referrers. */
const form = document.querySelector<HTMLFormElement>('#partner-form');
if (form) {
  const error = document.querySelector<HTMLElement>('#partner-error');
  const success = document.querySelector<HTMLElement>('#partner-success');
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const fields = form.querySelector<HTMLFieldSetElement>('fieldset');
  const event = (name: string, extra: Record<string, string> = {}) => {
    if (!window.protcityCookieConsent?.analytics || !window.protcityAnalyticsLoaded) return;
    window.gtag?.('event', name, { page_path: window.location.pathname, page_language: document.documentElement.lang, ...extra });
  };
  event('partner_page_view');
  document.querySelectorAll<HTMLElement>('[data-partner-cta]').forEach(link => link.addEventListener('click', () => event('partner_cta_click', { placement: link.dataset.partnerCta || 'page' })));
  let started = false, busy = false, requestKey = '', submittedPayload = '';
  form.addEventListener('input', (e) => {
    if (!started) { event('partner_form_start'); started = true; }
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) e.target.removeAttribute('aria-invalid');
  });
  form.noValidate = true;
  const showError = (message: string) => {
    if (!error) return;
    error.textContent = message;
    error.hidden = false;
    error.focus();
  };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy || !button || !fields || !error || !success) return;
    error.hidden = true;
    for (const input of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select')) {
      if (input.type !== 'checkbox') input.value = input.value.trim();
      input.removeAttribute('aria-invalid');
      input.setCustomValidity('');
      if ((input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) && input.value && input.minLength > input.value.length) input.setCustomValidity(form.dataset.invalid || 'Please check this field.');
    }
    if (!form.checkValidity()) {
      showError(form.dataset.invalid || 'Please check the form.');
      const invalid = form.querySelector<HTMLInputElement>('input:invalid, textarea:invalid, select:invalid');
      for (const input of form.querySelectorAll('input:invalid, textarea:invalid, select:invalid')) input.setAttribute('aria-invalid', 'true');
      invalid?.focus();
      event('partner_form_error', { reason: 'validation' });
      return;
    }
    const data = new FormData(form);
    const body = JSON.stringify({
      name: data.get('name'), email: data.get('email'), company: data.get('company'),
      market: data.get('market'), profileUrl: data.get('profileUrl'), collaboration: data.get('collaboration'),
      approach: data.get('approach'), language: form.dataset.language,
      privacyAcknowledged: data.get('privacyAcknowledged') === 'on', website: data.get('website')
    });
    const buttonContent = Array.from(button.childNodes, node => node.cloneNode(true));
    busy = true;
    fields.disabled = true;
    button.disabled = true;
    button.textContent = form.dataset.sending || 'Submitting…';
    form.setAttribute('aria-busy', 'true');
    event('partner_form_submit');
    try {
      // Keep the key after network/503 errors: a response may be lost after commit.
      // Edited input represents a new intent. No personal fields go into web storage.
      if (!requestKey || submittedPayload !== body) requestKey = crypto.randomUUID();
      submittedPayload = body;
      const response = await fetch('/api/partner-applications', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': requestKey },
        body, credentials: 'omit', signal: AbortSignal.timeout(20_000)
      });
      const result: unknown = await response.json();
      if (response.status === 202 && result && typeof result === 'object' && 'received' in result && result.received === true) {
        form.hidden = true;
        success.hidden = false;
        success.focus();
        form.reset();
        event('partner_form_success');
      } else {
        const reason = response.status === 429 ? 'rate' : response.status === 409 ? 'conflict' : response.status === 400 ? 'invalid' : 'error';
        showError(form.dataset[reason] || form.dataset.error || 'Please try again.');
        if (result && typeof result === 'object' && 'field' in result && typeof result.field === 'string') {
          const input = form.elements.namedItem(result.field);
          if (input instanceof HTMLElement) {
            input.setAttribute('aria-invalid', 'true');
            input.setAttribute('aria-describedby', 'partner-error');
          }
        }
        event('partner_form_error', { reason: response.status === 429 ? 'rate_limit' : response.status === 400 ? 'validation' : 'unavailable' });
      }
    } catch {
      showError(form.dataset.error || 'Please try again.');
      event('partner_form_error', { reason: 'network' });
    } finally {
      busy = false;
      fields.disabled = false;
      button.disabled = false;
      button.replaceChildren(...buttonContent);
      form.removeAttribute('aria-busy');
    }
  });
}
