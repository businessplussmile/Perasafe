# Security Specification - PERASafe Enterprise Cloud

## 1. Data Invariants
- A **User** profile must belong to the authenticated user and have a valid role.
- A **Company** must be created with the current user as the `ownerId`.
- A **Document** must belong to a company, and its access is restricted to company members or explicitly listed partners (by email).
- Documents have a "lifespan" that is tracked, but the rules should prevent modification of `createdAt` and `companyId` once set.

## 2. The "Dirty Dozen" Payloads (Attack Vectors)

| ID | Attack Type | Payload / Action | Target Collection | Expected Result |
|----|-------------|------------------|-------------------|-----------------|
| D1 | Identity Spoofing | Create user with different UID | `users/{victimId}` | PERMISSION_DENIED |
| D2 | Privilege Escalation | Update own user role to 'ADMIN' | `users/{myId}` | PERMISSION_DENIED |
| D3 | Resource Hijacking | Create company with victim's UID as owner | `companies/{newId}` | PERMISSION_DENIED |
| D4 | Shadow Field Injection | Update company with `isApproved: true` | `companies/{id}` | PERMISSION_DENIED |
| D5 | Data Poisoning | Create document with 1MB `title` string | `documents` | PERMISSION_DENIED |
| D6 | Cross-Company Leak | Get document from another company as a non-partner | `documents` | PERMISSION_DENIED |
| D7 | Immutable Violation | Update document `companyId` or `createdAt` | `documents` | PERMISSION_DENIED |
| D8 | Orphaned Document | Create document with non-existent `companyId` | `documents` | PERMISSION_DENIED |
| D9 | Email Spoofing | Access document using unverified email | `documents` | PERMISSION_DENIED |
| D10| Id Poisoning | Request document with ID `../../secrets` | `documents` | PERMISSION_DENIED |
| D11| Unbounded List | Create document with 10,000 `partnerIds` | `documents` | PERMISSION_DENIED |
| D12| Terminal Bypass | Re-activate a document that should be locked (not applicable here but good to test) | `documents` | PERMISSION_DENIED |

## 3. Test Scenarios (Manual or Automated)
- Test `list` queries for partners: `where("partnerIds", "array-contains", userEmail)`.
- Test `create` user profile ensures `email_verified == true`.
- Test `company` creation ensures `subscriptionStatus` is 'ACTIVE' or 'TRIAL' only.
