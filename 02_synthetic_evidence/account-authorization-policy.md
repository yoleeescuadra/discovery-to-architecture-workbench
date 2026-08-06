# Northstar Account Authorization Policy

Document ID: NS-SEC-04  
Version: 2.1  
Status: Approved  
Owner: Identity and Security

## Policy boundary

The AI-assisted support workflow is read-only. It cannot modify an account, subscription, identity setting, payment method, security control, or user entitlement.

## Identity context

Account-specific information may be used only when supplied through a trusted authenticated session. A customer-provided account name, email address, screenshot, or copied identifier does not establish verified identity.

## Required routing

- Requests to disable or reset multi-factor authentication must use the secure recovery process.
- Subscription and entitlement changes must use the authorized commercial workflow.
- Requests involving another customer's record must be blocked and escalated for security review.
- When trusted identity context is unavailable, the workflow may provide general guidance but must not disclose account-specific information.

