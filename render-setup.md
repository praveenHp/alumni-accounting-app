# 🚀 Quick Render Setup Guide

## 🔧 **Step-by-Step Setup**

### **1. Create PostgreSQL Database**
1. Go to https://dashboard.render.com
2. Click "New +" → "PostgreSQL"
3. Settings:
   - Name: `alumni-accounting-db`
   - Database: `alumni_accounting`
   - Plan: Free
4. Click "Create Database"
5. **Copy the External Database URL** (starts with `postgresql://`)

### **2. Update Your Web Service**
1. Go to your existing web service on Render
2. Click "Environment" tab
3. Add environment variable:
   - **Key:** `DATABASE_URL`
   - **Value:** [Paste the PostgreSQL URL from step 1]
4. Click "Save Changes"

### **3. Deploy**
Your app will automatically redeploy and use PostgreSQL!

## ✅ **Verification**
- Check logs: Should see "Using PostgreSQL database for production"
- Add a transaction: Should persist after app restart
- Data is now permanent!

## 🎊 **Done!**
Your transactions will never be lost again!
