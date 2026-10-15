# LAURREL SERVICES — TRANSACTIONAL EMAIL CONFIGURATION & DOMAIN VERIFICATION

This document outlines the step-by-step setup for transactional email delivery in production and staging for Laurrel Services.

---

## 1. Overview of Email Architecture

Laurrel Services uses transactional email for two critical customer flows:
1. **Intake Notification**: Immediate alert dispatched to the Laurrel coordination team (`ENQUIRY_TO_EMAIL`) containing lead details, requested services, location, and preferred timing.
2. **Customer Acknowledgement**: Immediate confirmation email dispatched to the client (`customer.email`) with their unique enquiry reference ID (e.g., `ENQ-A1B2C3D4`) and next steps.

The backend supports two swappable email notification engines:
- **Resend (Preferred)**: Modern transactional API with high deliverability, bounce tracking, and DKIM signing.
- **SMTP (Shared Hosting Fallback)**: Standard authenticated SMTP for sending through existing cPanel or shared hosting mailboxes.

---

## 2. Resend Setup & DNS Verification Guide

### Step 1: Create Account & Add Domain
1. Log in to [https://resend.com](https://resend.com).
2. Navigate to **Domains** → click **Add Domain**.
3. Enter your domain: `laurrelservices.ca` (or a dedicated mail subdomain such as `mail.laurrelservices.ca` / `send.laurrelservices.ca` if preferred).
4. Select your preferred sending region (e.g., **North America (East) - us-east-1** for lowest latency to Ottawa).

### Step 2: Add DNS Records in Your Domain Registrar
Resend will generate three DNS records:

| Record Type | Host / Name | Value / Target | Purpose |
| :--- | :--- | :--- | :--- |
| **TXT** | `resend._domainkey` | `k=rsa; p=MIGf...` (from Resend dashboard) | **DKIM** cryptographic signature verification |
| **TXT** | `@` (or subdomain) | `v=spf1 include:amazonses.com ~all` | **SPF** sender policy authorization |
| **MX** | `feedback` (or custom return-path) | `feedback-smtp.us-east-1.amazonses.com` | **Bounce handling & return-path** |

> [!IMPORTANT]
> **DO NOT CHANGE YOUR PRIMARY ROOT MX RECORDS.**
> Your existing MX records control where incoming business emails (`info@laurrelservices.ca`) are received (such as your shared hosting cPanel or Google Workspace).
> Resend ONLY requires the DKIM CNAME/TXT and SPF records for sending. It does NOT require replacing your primary root MX records. Leaving your root MX records untouched ensures current business email continues working without interruption.

### Step 3: Verify the Domain
1. In the Resend dashboard, click **Verify DNS Records**.
2. Verification typically completes within 2 to 15 minutes (DNS propagation may take up to 24 hours in rare cases).
3. Once verified, the domain status changes to **Verified** with green checkmarks.

### Step 4: Create Production API Key
1. In Resend, go to **API Keys** → click **Create API Key**.
2. Name: `laurrel-backend-production`.
3. Permission: **Sending access**.
4. Copy the API key (`re_...`).

---

## 3. Environment Variables Configuration

Set these variables in your **Render Web Service** dashboard:

```bash
# Provider Selection
EMAIL_PROVIDER=resend

# Resend API Key
RESEND_API_KEY=re_your_api_key_here

# Verified Sender Address
# Must use the domain verified in Step 3
EMAIL_FROM="Laurrel Dispatch <dispatch@laurrelservices.ca>"

# Business Intake Recipient Mailbox
# Where Ottawa coordinators receive new customer leads
ENQUIRY_TO_EMAIL=info@laurrelservices.ca
```

### Staging / Pre-Verification Testing Mode
Before your custom domain DNS is verified, you can test with Resend's free testing address:
```bash
EMAIL_FROM="Laurrel Dispatch <onboarding@resend.dev>"
ENQUIRY_TO_EMAIL=your-verified-personal-email@domain.com
```
*(Note: Resend test mode allows sending to the email address registered with your Resend account).*

---

## 4. Alternative: Shared Hosting SMTP Configuration

If you prefer to send notifications directly through your shared hosting cPanel mail server, configure:

```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=mail.laurrelservices.ca
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=dispatch@laurrelservices.ca
SMTP_PASSWORD=your_secure_mailbox_password
EMAIL_FROM="Laurrel Dispatch <dispatch@laurrelservices.ca>"
ENQUIRY_TO_EMAIL=info@laurrelservices.ca
```

---

## 5. End-to-End Verification Checklist

Before reporting email delivery as operational in production:

1. [ ] Resend domain shows `Verified` status in Resend dashboard.
2. [ ] `RESEND_API_KEY` is saved in Render environment variables.
3. [ ] `EMAIL_FROM` uses the verified domain (e.g. `dispatch@laurrelservices.ca`).
4. [ ] `ENQUIRY_TO_EMAIL` points to an actively monitored coordinator mailbox.
5. [ ] Submit a test enquiry through the `/contact` form or `/` quote modal.
6. [ ] Confirm the dispatch email is received in `ENQUIRY_TO_EMAIL` within 10 seconds.
7. [ ] Confirm the customer acknowledgement email is received by the submitter.
8. [ ] Verify that hitting "Reply" on the dispatch email directs the reply to the customer's email address.
