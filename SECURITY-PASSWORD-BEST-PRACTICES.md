# Password Security Best Practices in Software Development

## Overview
This document outlines industry standards and best practices for handling different types of passwords and credentials in software applications.

---

## 🔐 Two Main Categories of Passwords

### 1. User Authentication Passwords
**Definition:** Passwords that humans use to log into applications  
**Security Level:** CRITICAL - Must be hashed  
**Examples:** User login, admin accounts, personal passwords

### 2. Service/System Credentials
**Definition:** Credentials used for service-to-service communication  
**Security Level:** HIGH - Should be encrypted or managed securely  
**Examples:** API keys, database passwords, HTTP Basic Auth, service tokens

---

## ✅ User Authentication Passwords - ALWAYS HASH

### Industry Standard: Never Store Plain Text
```typescript
// ❌ NEVER DO THIS
const user = {
  email: "user@example.com",
  password: "plaintextPassword123"  // SECURITY VIOLATION!
}

// ✅ CORRECT APPROACH
const user = {
  email: "user@example.com",
  passwordHash: await bcrypt.hash("plaintextPassword123", 12)
}
```

### Recommended Hashing Algorithms
1. **bcrypt** (Most Popular)
   ```typescript
   import bcrypt from 'bcrypt'
   const hash = await bcrypt.hash(password, 12)
   const isValid = await bcrypt.compare(password, hash)
   ```

2. **Argon2** (Newer, More Secure)
   ```typescript
   import argon2 from 'argon2'
   const hash = await argon2.hash(password)
   const isValid = await argon2.verify(hash, password)
   ```

3. **scrypt** (Good Alternative)
   ```typescript
   import scrypt from 'scrypt'
   const hash = await scrypt.hash(password, salt)
   ```

### Why Hash User Passwords?
- **Irreversible:** Cannot recover original password
- **Breach Protection:** Even if database is compromised
- **Industry Compliance:** Required by security standards
- **User Privacy:** Users can't be impersonated easily

---

## ⚠️ Service Credentials - Encrypt When Possible

### Common Service Credential Types
```typescript
// HTTP Basic Auth (like Dokploy's case)
const basicAuth = {
  username: "admin",
  password: "servicePassword123"  // Often stored as-is
}

// Database Connection
const dbConfig = {
  host: "localhost",
  username: "dbuser", 
  password: "dbPassword123"  // Should be encrypted
}

// API Keys
const apiConfig = {
  apiKey: "sk-1234567890abcdef",  // Should be encrypted
  secretKey: "secret123"
}
```

### Why Service Credentials Are Different
- **Retrievability Required:** Systems need the actual value
- **Service-to-Service:** Not human authentication
- **Configuration Data:** Used to configure external services
- **Often Required in Plain Text:** By the consuming service

---

## 🛡️ Best Practices for Service Credentials

### 1. Encrypted Storage (Recommended)
```typescript
// Store encrypted in database
const encryptedPassword = encrypt(plainPassword, masterKey)

// Decrypt only when needed
const plainPassword = decrypt(encryptedPassword, masterKey)
```

### 2. Environment Variables
```bash
# Don't store in database at all
BASIC_AUTH_USERNAME=admin
BASIC_AUTH_PASSWORD=mySecretPassword123
API_KEY=sk-1234567890abcdef
```

### 3. Secret Management Systems
```typescript
// HashiCorp Vault
const secret = await vault.read('secret/myapp/credentials')

// AWS Secrets Manager
const secret = await secretsManager.getSecretValue({
  SecretId: 'myapp/basic-auth'
})

// Kubernetes Secrets
const secret = await k8sApi.readNamespacedSecret('my-secret', 'default')
```

### 4. Configuration Management
```typescript
// Docker Compose with external secrets
services:
  app:
    environment:
      - BASIC_AUTH_USERNAME_FILE=/run/secrets/basic_auth_username
      - BASIC_AUTH_PASSWORD_FILE=/run/secrets/basic_auth_password
```

---

## 📊 Industry Examples by Technology

### Web Applications
```typescript
// User passwords: ALWAYS hash
const userPassword = await bcrypt.hash(inputPassword, 12)

// API keys: Encrypt or use secret management
const apiKey = encrypt(plainApiKey, encryptionKey)
```

### Microservices
```typescript
// Service-to-service: Use tokens, not passwords
const serviceToken = await generateJWT({
  serviceId: 'user-service',
  permissions: ['read:users']
})
```

### Container Orchestration
```yaml
# Kubernetes - Base64 encoded (not encrypted!)
apiVersion: v1
kind: Secret
type: Opaque
data:
  username: YWRtaW4=  # admin (base64)
  password: cGFzc3dvcmQ=  # password (base64)
```

### Infrastructure as Code
```hcl
# Terraform with AWS Secrets Manager
resource "aws_secretsmanager_secret" "app_credentials" {
  name = "my-app/credentials"
  description = "Application credentials"
}
```

---

## 🎯 Dokploy's Current Approach Analysis

### What Dokploy Does (Basic Auth Credentials)
```typescript
// HTTP Basic Auth for Traefik/nginx
const security = {
  username: "admin",
  password: "mySecretPassword123"  // Stored in database
}
```

### Security Assessment
- ✅ **Good:** Passwords hidden in UI (your recent fix)
- ✅ **Good:** Not logged in application logs
- ⚠️ **Questionable:** Stored in plain text in database
- ✅ **Good:** Access controlled through application permissions

### Industry Comparison
- **Similar to:** Docker Compose, many CI/CD tools, basic web apps
- **Better than:** Applications that log credentials
- **Worse than:** Secret management systems (Vault, AWS Secrets Manager)

---

## 🚀 Recommended Improvements for Dokploy

### Short Term (Easy Wins)
1. **UI Security** ✅ (Already implemented)
   - Hide passwords in display
   - Add copy-to-clipboard functionality
   - Prevent accidental exposure

2. **Audit Logging**
   ```typescript
   // Log when credentials are accessed
   auditLog.info('Security credentials viewed', {
     userId: user.id,
     securityId: security.securityId,
     action: 'view'
   })
   ```

3. **Database Encryption at Rest**
   ```sql
   -- Ensure database encryption is enabled
   ALTER DATABASE dokploy_db ENCRYPTION = 'Y';
   ```

### Medium Term (Better Security)
1. **Encrypt Credentials in Database**
   ```typescript
   // Before storing
   const encryptedPassword = encrypt(password, masterKey)
   
   // When retrieving
   const decryptedPassword = decrypt(encryptedPassword, masterKey)
   ```

2. **Secret Rotation**
   ```typescript
   // Allow users to rotate credentials
   const newCredentials = generateSecureCredentials()
   await updateSecurityCredentials(securityId, newCredentials)
   ```

### Long Term (Enterprise Grade)
1. **External Secret Management**
   ```typescript
   // Integrate with HashiCorp Vault
   const credentials = await vault.read('secret/dokploy/basic-auth')
   ```

2. **Zero-Knowledge Architecture**
   - Application never sees plain text passwords
   - Direct integration with secret management
   - Automatic rotation and lifecycle management

---

## 🔍 Security Considerations by Use Case

### High-Risk Scenarios
- **Public/shared computers:** Always hide passwords in UI
- **Screen sharing:** Implement timeout for credential views
- **Audit requirements:** Log all credential access
- **Compliance:** PCI-DSS, HIPAA, SOX requirements

### Medium-Risk Scenarios
- **Internal tools:** Basic encryption sufficient
- **Development environments:** Environment variables OK
- **Single-tenant applications:** Database encryption adequate

### Low-Risk Scenarios
- **Personal projects:** Basic hashing sufficient
- **Proof of concepts:** Plain text storage acceptable (with warnings)

---

## 📚 Additional Resources

### Security Standards
- **OWASP Password Storage Cheat Sheet**
- **NIST Special Publication 800-63B**
- **PCI DSS Requirements**

### Tools and Libraries
- **HashiCorp Vault:** Enterprise secret management
- **AWS Secrets Manager:** Cloud-native secret management
- **Kubernetes Secrets:** Container orchestration secrets
- **bcrypt, Argon2:** Password hashing libraries

### Best Practices Summary
1. **Hash user passwords** - Always, no exceptions
2. **Encrypt service credentials** - When possible
3. **Use secret management** - For production systems
4. **Hide in UI** - Prevent accidental exposure
5. **Audit access** - Log credential usage
6. **Rotate regularly** - Implement credential lifecycle
7. **Principle of least privilege** - Only expose when needed

---

## 💡 Key Takeaways

1. **Context Matters:** User passwords vs service credentials have different requirements
2. **Your UI Fix is Valuable:** Even if backend storage could be improved
3. **Industry Trend:** Moving toward encrypted secret management
4. **Risk Assessment:** Consider your threat model and compliance requirements
5. **Gradual Improvement:** Start with UI security, move toward encryption

Remember: **Perfect security is impossible, but good security is achievable through layered defenses.**
