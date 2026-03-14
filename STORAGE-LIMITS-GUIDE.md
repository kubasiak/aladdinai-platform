# 📊 Storage Limits & Tracking Guide

## Overview

Your AladdinAI platform now has a **two-tier system** for managing storage and costs:

1. **Provider Panel** (YOU only) - Set limits and view all customers
2. **Admin Panel** (CUSTOMERS) - View their usage and limits (no settings)

---

## 🎯 Provider Panel (For You)

**Access:** `provider.html`

**Login:** Use your provider email: `anna@aladdinai.com`

### Features:

#### Platform Statistics
- Total customers
- Total storage used across platform
- Total files count
- **Estimated monthly cost** (storage + bandwidth)

#### Global Limits Configuration
Set these limits for ALL customers:
- **Max File Size:** Individual file size limit (default: 50MB)
- **Storage Per Customer:** Total storage per customer (default: 500MB)
- **Max Video Size:** Video file limit (default: 50MB)
- **Max Audio Size:** Audio file limit (default: 20MB)

#### Customers Overview Table
For each customer, see:
- Customer ID
- Email
- Storage used (MB / MB limit)
- Usage progress bar (green/yellow/red)
- Status badge (Normal/High/Critical)
- **Estimated cost** per customer

### Default Limits (Recommended)
- **Storage per customer:** 500MB
- **Max video file:** 50MB
- **Max audio file:** 20MB

**For 3 customers:**
- Total: 1.5GB (30% of 5GB free tier)
- **Cost: $0.00/month** ✅

---

## 👤 Admin Panel (For Customers)

**Access:** `admin.html`

### New Storage Tracking Section

Customers now see:

#### Storage Usage Box
- **Storage Used:** `45 MB / 500 MB`
- **Progress Bar:** Visual indicator (color-coded)
  - Green: 0-70% (Normal)
  - Yellow: 70-90% (High)
  - Red: 90-100% (Critical)
- **Files Count:** Videos, audio, screenshots
- **Estimated Cost:** `$0.00/month (Free)` or `$X.XX/month`

#### Upload Blocking
When customer tries to upload:
1. System checks current usage + file size
2. If exceeds limit → **Upload blocked** with error message
3. If within limit → Upload proceeds

**Error Messages:**
- `Video file too large. Maximum: 50MB`
- `Storage limit exceeded. Used: 450MB, Limit: 500MB. Delete some files to free up space.`

---

## 💰 Cost Calculation

### Firebase Blaze Plan (Pay-as-you-go)

#### Storage Costs
- **Free tier:** 5GB
- **After free tier:** $0.026/GB/month

#### Bandwidth Costs
- **Free tier:** 1GB/day (~30GB/month)
- **After free tier:** $0.12/GB

### Examples:

**Scenario 1: 3 Customers, 500MB each**
- Total storage: 1.5GB ✅ Within free tier
- Estimated bandwidth: 30GB/month ✅ Within free tier
- **Cost: $0.00/month**

**Scenario 2: 3 Customers exceed storage**
- Total storage: 6GB (exceeds by 1GB)
- Storage cost: 1GB × $0.026 = **$0.026/month** (3 cents)
- Bandwidth: Still free
- **Total: $0.03/month**

**Scenario 3: High traffic (10,000 visits/month)**
- Storage: 1.5GB ✅ Free
- Bandwidth: 100GB (70GB over limit)
- Bandwidth cost: 70GB × $0.12 = **$8.40/month**
- **Total: $8.40/month**

---

## ⚙️ How It Works

### Upload Process:

1. **Customer uploads file** → Admin panel
2. **System checks:**
   - Is file too large? (> max file size)
   - Will this exceed storage limit? (current + new > limit)
3. **If checks pass:**
   - File uploaded to Firebase Storage
   - Metadata saved to Firestore
   - Storage usage updated in real-time
4. **If checks fail:**
   - Upload blocked
   - Error message shown
   - No charge incurred

### Real-time Tracking:

- Every upload/delete updates usage display
- Progress bar changes color based on usage
- Cost estimates update automatically
- Provider can see all customers in dashboard

---

## 🔐 Access Control

### Provider Panel (`provider.html`)
- **Only accessible by:** Provider email (`anna@aladdinai.com`)
- **Can:** View all customers, set limits, see costs
- **Cannot:** Edit customer content directly

### Admin Panel (`admin.html`)
- **Accessible by:** Any authenticated customer
- **Can:** View their own usage, upload files (within limits), edit their content
- **Cannot:** See other customers, change limits, access provider dashboard

---

## 🚀 Next Steps

### Before Upgrading to Blaze:

1. **Set your limits** in provider panel:
   - Login to `provider.html`
   - Configure storage per customer (500MB recommended)
   - Save limits

2. **Test with your account:**
   - Login to `admin.html` as a customer
   - Verify storage tracking appears
   - Try uploading files
   - Check limit enforcement

3. **Upgrade to Blaze:**
   - Add credit card to Firebase
   - Costs stay $0 within free tier
   - You'll be notified if approaching limits

### After Upgrading:

1. **Monitor costs** in provider panel
2. **Set budget alerts** in Google Cloud Console:
   - Alert at $1
   - Alert at $5
   - Alert at $10
3. **Adjust limits** if needed based on actual usage

---

## 📋 Files Modified

### Created:
- `public/provider.html` - Provider dashboard UI
- `public/assets/js/provider.js` - Provider logic

### Updated:
- `public/admin.html` - Added storage usage section
- `public/assets/js/admin-firebase.js` - Added tracking & limits
- `public/assets/js/firebase-storage.js` - Added usage calculation & cost estimation

---

## ❓ FAQ

**Q: What if customer hits limit?**
A: They can't upload more files until they delete some. They see clear error message.

**Q: Can I change limits per customer?**
A: Currently global limits for all customers. Custom per-customer limits would require code changes.

**Q: What if I don't have a credit card?**
A: Try debit card or Revolut. If not accepted, you can't use Firebase Storage (Blaze required).

**Q: How do I track actual costs?**
A: Check Firebase Console → Usage & Billing → Usage tab for real-time costs.

**Q: Can I set a hard spending cap?**
A: Yes, in Google Cloud Console → Billing → Budgets → Set cap (but service stops if hit).

---

## 🎉 Summary

✅ **Provider panel created** - Full control over limits and costs
✅ **Storage tracking added** - Real-time usage display
✅ **Limits enforced** - Uploads blocked when limit exceeded
✅ **Cost estimates** - See projected costs before charges
✅ **Free tier optimized** - 3 customers fit comfortably in free tier

**Ready to upgrade to Blaze plan and complete Firebase setup!** 🚀
