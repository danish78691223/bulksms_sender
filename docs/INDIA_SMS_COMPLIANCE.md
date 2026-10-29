# India promotional SMS readiness checklist

This is an engineering checklist, not legal advice. Confirm current requirements with the telecom operator/provider and qualified compliance counsel.

- Register the business/entity as required for commercial communication (Principal Entity onboarding).
- Obtain and configure the appropriate sender header.
- Register and obtain approval for the exact content template and its variables through the applicable DLT process.
- Ensure the intended message category/route is correct; promotional offers and festival discounts should not be treated as service messages merely because they include a greeting.
- Capture and retain valid consent evidence for the relevant promotional purpose where required.
- Check applicable customer preferences, DND/suppression rules, time windows and provider restrictions before submission.
- Support opt-out/withdrawal and promptly suppress withdrawn recipients.
- Do not infer consent from phone contacts, previous purchases, or CSV import alone.
- Keep an audit trail of consent/withdrawal and campaign/template references.
- Use provider webhooks with signature verification and map provider statuses accurately.
- Test with a small eligible audience before increasing volume.

Real SMS sending is intentionally disabled in this starter until a real provider adapter and compliance configuration are added.
