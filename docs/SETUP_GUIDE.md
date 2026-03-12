# AladdinAI Platform - Setup Guide

Complete setup guide for the multi-tenant landing page platform.

## Prerequisites

- Node.js 16+ installed
- Google/Firebase account
- Basic command line knowledge

---

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Name: `aladdinai-platform`
4. Disable Google Analytics (optional)
5. Click "Create Project"

### 1.2 Enable Required Services

**Authentication:**
1. Go to Authentication → Get Started
2. Enable "Email/Password" sign-in method

**Firestore:**
1. Go to Firestore Database → Create Database
2. Start in **production mode**
3. Choose closest region

**Storage:**
1. Go to Storage → Get Started
2. Start in **production mode**

**Hosting:**
1. Go to Hosting → Get Started
2. Follow wizard

### 1.3 Get Firebase Config

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click Web app icon `</>`
4. Register app: `aladdinai-web`
5. **Copy the firebaseConfig object**

---

## Step 2: Local Setup

### 2.1 Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2.2 Login to Firebase

```bash
firebase login
```

### 2.3 Initialize Firebase in Project

```bash
cd /path/to/AladdinAI-Platform/firebase
firebase init
```

**Select:**
- ✅ Firestore
- ✅ Storage
- ✅ Hosting

**Configuration:**
- Firestore rules: `firestore.rules`
- Firestore indexes: `firestore.indexes.json`
- Storage rules: `storage.rules`
- Hosting directory: `../public`
- Single-page app: `No`

### 2.4 Update Firebase Config

Edit `public/firebase-config.js` and paste your config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

---

## Step 3: Create Customer Accounts

### 3.1 Create Customer via Firebase Console

1. Go to Authentication → Users
2. Click "Add User"
3. Email: `customer1@example.com`
4. Password: (generate secure password)
5. Copy the **User UID** - this is their Customer ID

### 3.2 Or Create via CLI

```bash
firebase auth:import customers.csv --hash-algo=SCRYPT
```

### 3.3 Send Credentials to Customer

Send them:
- Login URL: `https://your-project.web.app/login.html`
- Email: `customer1@example.com`
- Password: `their-password`

---

## Step 4: Deploy

### 4.1 Deploy Everything

```bash
cd firebase
firebase deploy
```

### 4.2 Deploy Specific Services

```bash
# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Storage rules
firebase deploy --only storage:rules
```

---

## Step 5: Customer Onboarding

### 5.1 Customer Login

Customer visits: `https://your-project.web.app/login.html`

1. Enters their email/password
2. Gets redirected to `/admin.html`

### 5.2 Customer Customization

Customer can now:
- Upload videos (max 15MB)
- Upload audio (max 10MB)
- Customize text, colors, fonts
- Add card backgrounds
- Adjust overlay settings

**All changes save to Firestore + Firebase Storage automatically!**

### 5.3 View Public Page

Public page: `https://your-project.web.app/index.html?customer=CUSTOMER_ID`

Or set up custom domain: `https://www.customer-company.com`

---

## Step 6: Multiple Customers

### 6.1 Create More Customers

Repeat Step 3 for each customer:
1. Add user in Firebase Auth
2. Send credentials
3. Customer logs in and customizes

### 6.2 Data Isolation

Each customer's data is **completely isolated**:
- Firestore: `/customers/{customerId}/`
- Storage: `/customers/{customerId}/`
- Security rules enforce isolation

---

## Step 7: Custom Domains (Optional)

### 7.1 Per-Customer Subdomains

**Option A:** Dynamic subdomains
- `customer1.aladdinai.app`
- `customer2.aladdinai.app`

Requires Cloud Functions to route by subdomain.

**Option B:** Custom domains per customer
1. Customer owns `www.their-company.com`
2. Go to Hosting → Add Custom Domain
3. Follow DNS verification
4. Firebase serves their page at their domain

---

## Cost Estimate

### Firebase Free Tier (Spark Plan)

**Enough for 5-10 customers:**
- Firestore: 50K reads/day, 20K writes/day
- Storage: 5GB stored, 1GB/day downloads
- Hosting: 10GB/month bandwidth
- 100% FREE

### Paid Tier (Blaze Plan)

**For 10-50 customers:** ~$25-75/month
- Pay only for what you use
- Auto-scales
- No commitment

---

## Troubleshooting

### Issue: "Permission denied" errors

**Fix:** Deploy security rules
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### Issue: Customer can't upload files

**Fix:** Check Storage rules allow authenticated users

### Issue: Changes don't save

**Fix:** Check browser console for errors, verify Firebase config

---

## Next Steps

1. **Customize branding** in HTML/CSS
2. **Add analytics** (Google Analytics, Mixpanel)
3. **Email notifications** (SendGrid, Firebase Functions)
4. **Backup strategy** (Firestore export, Storage backup)
5. **Monitoring** (Firebase Performance, Error reporting)

---

## Support

**Firebase Docs:** https://firebase.google.com/docs
**Firestore:** https://firebase.google.com/docs/firestore
**Storage:** https://firebase.google.com/docs/storage

---

Built with ❤️ using Firebase and Claude Sonnet 4.5
