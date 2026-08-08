# Northstar Knowledge Governance Standard

Document ID: NS-GOV-09  
Version: 1.2  
Status: Approved  
Owner: Knowledge Management

## Source approval

Only documents with an approved status, named owner, and current version may support a customer-facing claim.

## Conflict handling

When two retrieved passages conflict, the workflow must not select one based only on retrieval score. It must compare document status and version, prefer the current approved source when the governance record is conclusive, and otherwise escalate the conflict to the document owner.

## Lifecycle

Document owners review approved content every ninety days. Superseded material remains available for audit history but must be excluded from the active retrieval index.

## Retrieval failure

If the retrieval service is unavailable, the assistant must state that it cannot verify the answer and route the request to the normal support workflow. It must not answer from model memory.

