# Quick Start Checklist

Get your platform live in 30-60 minutes.

## ☑️ Pre-Flight Checklist

- [ ] Have Google/Firebase account
- [ ] Have Node.js installed (`node --version`)
- [ ] Have Firebase CLI installed (`firebase --version`)
- [ ] Reviewed STATUS.md to understand what was built

---

## 🚀 Launch Sequence

### Step 1: Create Firebase Project (5 min)

- [ ] Go to https://console.firebase.google.com/
- [ ] Click "Add Project"
- [ ] Name: `aladdinai-platform`
- [ ] Create project

### Step 2: Enable Services (5 min)

- [ ] Enable Authentication (Email/Password)
- [ ] Enable Firestore Database (production mode)
- [ ] Enable Storage (production mode)
- [ ] Enable Hosting

### Step 3: Get Config (2 min)

- [ ] Project Settings → Your Apps → Web
- [ ] Register app: `aladdinai-web`
- [ ] Copy `firebaseConfig` object

### Step 4: Update Config File (2 min)

- [ ] Edit `public/firebase-config.js`
- [ ] Paste your real Firebase config
- [ ] Save file

### Step 5: Deploy (10 min)

```bash
cd C:\Users\ankubasi\repos\AladdinAI-Platform\firebase
firebase login
firebase init
firebase deploy
```

- [ ] Firebase login successful
- [ ] Firebase init complete
- [ ] Deployment successful
- [ ] Note your URL: `https://YOUR-PROJECT.web.app`

### Step 6: Create First Customer (3 min)

- [ ] Firebase Console → Authentication → Add User
- [ ] Email: `test@example.com`
- [ ] Password: `TestPassword123!`
- [ ] Copy User UID (this is Customer ID)

### Step 7: Test (10 min)

- [ ] Visit `https://YOUR-PROJECT.web.app/login.html`
- [ ] Login with test credentials
- [ ] Upload a test video
- [ ] Change some text
- [ ] Save changes
- [ ] Open `https://YOUR-PROJECT.web.app/index.html`
- [ ] Verify changes appear ✅

---

## ✅ Success Criteria

You're done when:
1. ✅ Customer can login
2. ✅ Customer can upload media
3. ✅ Customer can edit text/settings
4. ✅ Changes persist (reload page, still there)
5. ✅ Public page shows customer's changes

---

## 🆘 If Something Goes Wrong

### Issue: Can't deploy
**Fix:**
```bash
firebase login --reauth
```

### Issue: Permission denied
**Fix:**
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### Issue: Login doesn't work
**Fix:**
- Check `firebase-config.js` has correct config
- Check Authentication is enabled in Firebase Console

### Issue: Uploads fail
**Fix:**
- Check Storage rules are deployed
- Check file size (max 15MB video, 10MB audio)

---

## 📞 Need Help?

1. Check `docs/SETUP_GUIDE.md` for detailed instructions
2. Check Firebase Console for errors
3. Check browser console (F12) for JavaScript errors

---

## 🎯 Next Steps After Launch

- [ ] Create real customer accounts
- [ ] Customize branding (colors, logo)
- [ ] Set up custom domain (optional)
- [ ] Add analytics (optional)
- [ ] Monitor usage in Firebase Console

---

Ready? Let's go! 🚀

Start with Step 1 above.
