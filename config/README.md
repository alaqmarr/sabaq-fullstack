# Protected Users Configuration

## Purpose

This configuration file (`config/protected-users.json`) specifies ITS Numbers whose **roles cannot be modified** by anyone, including SuperAdmins.

## Usage

### Adding Protected Users

Edit `config/protected-users.json` and add ITS numbers to the `protectedUsers` array:

```json
{
  "protectedUsers": [
    "12345678",
    "87654321",
    "11223344"
  ],
  "description": "ITS Numbers listed here are protected from role modifications by anyone, including SuperAdmins."
}
```

### Behavior

When a protected user's role is attempted to be modified:
- ❌ The update will be **rejected**
- ⚠️ An error message will display: "Role cannot be modified for ITS XXXXXXXX - This account is protected."
- ✅ Other user fields (name, email, etc.) can still be updated

### Use Cases

- **System Administrator Accounts**: Prevent accidental demotion of critical admin accounts
- **Service Accounts**: Protect automated system accounts
- **Founder/Owner Accounts**: Ensure primary system owners maintain access

### Security Note

The config file is read from the server filesystem and cannot be modified through the web interface. Direct server access is required to change protected users.

---

**File Location:** `config/protected-users.json`

**Implementation:** [`actions/users.ts`](file:///c:/Users/DELL/Desktop/Web%20Dev/sabaqnew/actions/users.ts#L7-L20)
