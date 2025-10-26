# 🔧 Database Connection Troubleshooting

## 🚨 **Common Error: ENETUNREACH**

If you see this error:
```
Error: connect ENETUNREACH 2406:da14:271:9904:3491:66cf:4f33:c994:5432
```

This is an **IPv6 connectivity issue** between Render and your database provider.

## 🛠️ **Solutions (Try in Order)**

### **Solution 1: Check DATABASE_URL Format**
Your `DATABASE_URL` should look like:
```
postgresql://username:password@hostname:5432/database_name
```

**Common Issues:**
- ❌ Missing `postgresql://` prefix
- ❌ Wrong port (should be 5432)
- ❌ Special characters in password not URL-encoded

### **Solution 2: Use Different Database Provider**
Some providers work better with Render:

#### **✅ Supabase (Recommended)**
- Go to https://supabase.com
- Create project → Settings → Database
- Copy "URI" connection string
- Works great with Render!

#### **✅ Neon (Alternative)**  
- Go to https://neon.tech
- Create database
- Copy connection string
- Good IPv4 support

#### **✅ ElephantSQL (Reliable)**
- Go to https://www.elephantsql.com
- Free tier: 20MB (enough for testing)
- Excellent Render compatibility

### **Solution 3: Force IPv4 Connection**
If using current provider, try adding these parameters to your DATABASE_URL:
```
postgresql://user:pass@host:5432/db?sslmode=require&connect_timeout=10
```

### **Solution 4: Alternative Hosting**
If database issues persist, consider:

#### **Railway** (Includes PostgreSQL)
- Move entire app to Railway
- Built-in PostgreSQL included
- No external database needed

#### **Heroku** (Reliable but paid)
- Heroku Postgres works perfectly
- $7/month but very reliable

## 🔍 **Debugging Steps**

### **1. Check Environment Variable**
In Render dashboard:
- Go to your service → Environment
- Verify `DATABASE_URL` is set correctly
- No extra spaces or characters

### **2. Test Connection Locally**
```bash
# Set your DATABASE_URL locally
export DATABASE_URL="your-connection-string"

# Run test script
node test-db-connection.js
```

### **3. Check Render Logs**
```bash
# View real-time logs
render logs --service your-service-name --tail
```

Look for:
- ✅ "Using PostgreSQL database for production"
- ✅ "PostgreSQL connection test successful"
- ❌ Any connection errors

## 🎯 **Recommended Quick Fix**

**Switch to Supabase** (5 minutes):

1. **Create Supabase account:** https://supabase.com
2. **New project:** Choose name and password
3. **Get connection string:** Settings → Database → URI
4. **Update Render:** Environment → DATABASE_URL → Save
5. **Redeploy:** Automatic

Supabase has excellent Render compatibility and rarely has connection issues.

## 📊 **Provider Compatibility**

| Provider | Render Compatibility | Free Tier | Setup Difficulty |
|----------|---------------------|-----------|------------------|
| **Supabase** | ⭐⭐⭐⭐⭐ | 500MB | Easy |
| **Neon** | ⭐⭐⭐⭐ | 3GB | Easy |
| **ElephantSQL** | ⭐⭐⭐⭐ | 20MB | Easy |
| **Aiven** | ⭐⭐⭐ | Trial only | Medium |
| **AWS RDS** | ⭐⭐ | Complex setup | Hard |

## 🆘 **Still Having Issues?**

1. **Check Render Status:** https://status.render.com
2. **Try different database provider** (Supabase recommended)
3. **Contact Render support** with your logs
4. **Consider Railway** as alternative platform

## ✅ **Success Indicators**

When working correctly, you should see:
```
Using PostgreSQL database for production
PostgreSQL connection test successful  
Connected to PostgreSQL database
Database tables created successfully
Alumni Accounting App server running on port 3000
```

Your transactions will then persist between deployments! 🎉
