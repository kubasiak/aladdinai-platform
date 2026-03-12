# AladdinAI Platform - Multi-Tenant Landing Page System

Production-ready landing page platform with backend for customer self-service customization.

## Architecture

**Frontend:** Vanilla JavaScript (HTML/CSS/JS)
**Backend:** Firebase (Firestore + Storage + Hosting + Functions)
**Authentication:** Firebase Auth
**Storage:** Firebase Cloud Storage
**Database:** Firestore (NoSQL)

## Features

✅ **Multi-Tenant:** Each customer gets isolated data
✅ **Self-Service Admin:** Customers customize via admin panel
✅ **Media Uploads:** Videos, audio, images persist to cloud storage
✅ **Settings Persistence:** All changes saved to database
✅ **Authentication:** Secure customer access
✅ **Scalable:** Auto-scales with Firebase
✅ **Real-time:** Changes reflect immediately

## Structure

```
AladdinAI-Platform/
├── public/                 # Frontend files (deployed to Firebase Hosting)
│   ├── index.html         # Public landing page
│   ├── admin.html         # Admin panel
│   ├── login.html         # Customer login
│   ├── assets/
│   │   ├── css/
│   │   ├── js/
│   │   └── images/
│   └── config.js          # Firebase config
├── firebase/               # Firebase configuration
│   ├── functions/         # Cloud Functions (API endpoints)
│   ├── firestore.rules    # Database security
│   ├── storage.rules      # File storage security
│   └── firebase.json      # Firebase project config
├── docs/                   # Documentation
└── scripts/                # Deployment scripts
```

## Quick Start

### 1. Setup Firebase Project

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in this directory
firebase init
```

### 2. Configure Customer

Each customer gets:
- Unique subdomain: `customer-name.yourapp.web.app`
- Or custom domain: `www.customer.com`
- Isolated data in Firestore
- Isolated file storage

### 3. Deploy

```bash
firebase deploy
```

## Customer Onboarding

1. Create customer account in Firebase Auth
2. Assign customer ID
3. Customer logs in at `/login.html`
4. Customer accesses admin at `/admin.html`
5. Customer uploads media and customizes
6. Changes save to Firestore + Firebase Storage
7. Public page loads from customer's data

## Scaling (2-10+ customers)

- **2-5 customers:** Single Firebase project, multi-tenant
- **10+ customers:** Consider separate Firebase projects per customer
- **100+ customers:** Add load balancing, CDN, caching

## Security

- Firestore rules enforce customer data isolation
- Storage rules ensure customers can only access their files
- Authentication required for admin panel
- Public pages accessible without auth

## Cost Estimate (Firebase Free Tier)

- **Firestore:** 50K reads/day, 20K writes/day
- **Storage:** 5GB stored, 1GB/day downloads
- **Hosting:** 10GB/month bandwidth
- **Enough for:** 5-10 customers with moderate traffic

**Paid tier:** Pay-as-you-go, ~$25-50/month for 20-30 customers

---

Built with Claude Sonnet 4.5
