#!/bin/bash

# Alumni Accounting App - Quick Deploy Setup Script

echo "🚀 Setting up Alumni Accounting App for deployment..."

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
fi

# Add all files
echo "📦 Adding files to Git..."
git add .

# Commit
echo "💾 Creating commit..."
git commit -m "Ready for deployment - Alumni Accounting App

Features:
- Transaction management (Credit/Debit)
- Real-time balance tracking
- Person tracking (From/To)
- Payment mode tracking (Cash/Online)
- Category management
- Filtering and export capabilities
- Responsive design
- Complete test suite"

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Create a repository on GitHub"
echo "2. Run: git remote add origin https://github.com/yourusername/alumni-accounting-app.git"
echo "3. Run: git branch -M main"
echo "4. Run: git push -u origin main"
echo "5. Deploy to Railway/Render using the GitHub repository"
echo ""
echo "📖 See DEPLOYMENT-GUIDE.md for detailed instructions"
