import api from '../api'

class RealTimeStatsService {
  constructor() {
    this.subscribers = new Set()
    this.stats = {
      dashboard: null,
      ads: null,
      profile: null,
      credit: null
    }
    this.intervals = new Map()
    this.isRunning = false
    this.isAuthenticated = false
    this.userRole = null
  }

  // Subscribe to real-time updates
  subscribe(callback) {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  // Notify all subscribers of updates
  notify(data) {
    this.subscribers.forEach(callback => callback(data))
  }

  // Set authentication status and user role
  setAuthStatus(authenticated, role = null) {
    this.isAuthenticated = authenticated
    this.userRole = role
    if (!authenticated) {
      this.stop()
    }
  }

  // Start real-time monitoring
  start() {
    if (this.isRunning || !this.isAuthenticated) return
    
    this.isRunning = true
    
    // Only start intervals for relevant stats based on user role
    if (this.userRole === 'advertiser') {
      // Dashboard stats - every 15 seconds (advertiser only)
      this.intervals.set('dashboard', setInterval(() => {
        if (this.isAuthenticated) {
          this.fetchDashboardStats()
        }
      }, 15000))
      
      // Ads stats - every 30 seconds (advertiser only)
      this.intervals.set('ads', setInterval(() => {
        if (this.isAuthenticated) {
          this.fetchAdsStats()
        }
      }, 30000))
      
      // Profile stats - every 45 seconds (advertiser only)
      this.intervals.set('profile', setInterval(() => {
        if (this.isAuthenticated) {
          this.fetchProfileStats()
        }
      }, 45000))
      
      // Credit stats - every 60 seconds (advertiser only)
      this.intervals.set('credit', setInterval(() => {
        if (this.isAuthenticated) {
          this.fetchCreditStats()
        }
      }, 60000))
    } else if (this.userRole === 'viewer') {
      // For viewers, only fetch profile and credit stats
      // Profile stats - every 45 seconds
      this.intervals.set('profile', setInterval(() => {
        if (this.isAuthenticated) {
          this.fetchViewerProfileStats()
        }
      }, 45000))
      
      // Credit stats - every 60 seconds
      this.intervals.set('credit', setInterval(() => {
        if (this.isAuthenticated) {
          this.fetchViewerCreditStats()
        }
      }, 60000))
    }
    
    // Initial fetch only if authenticated
    if (this.isAuthenticated) {
      this.fetchAllStats()
    }
  }

  // Stop real-time monitoring
  stop() {
    this.isRunning = false
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals.clear()
  }

  // Fetch all statistics (role-based)
  async fetchAllStats() {
    if (!this.isAuthenticated) return
    
    try {
      if (this.userRole === 'advertiser') {
        await Promise.all([
          this.fetchDashboardStats(),
          this.fetchAdsStats(),
          this.fetchProfileStats(),
          this.fetchCreditStats()
        ])
      } else if (this.userRole === 'viewer') {
        await Promise.all([
          this.fetchViewerProfileStats(),
          this.fetchViewerCreditStats()
        ])
      }
    } catch (error) {
      console.error('Error fetching all stats:', error)
    }
  }

  // Fetch dashboard statistics
  async fetchDashboardStats() {
    if (!this.isAuthenticated || this.userRole !== 'advertiser') return
    
    try {
      const response = await api.get('/advertiser/dashboard')
      const stats = response.data.stats || {}
      
      this.stats.dashboard = {
        totalViews: stats.total_views || 0,
        totalAds: stats.total_ads || 0,
        activeAds: stats.active_ads || 0,
        totalSpent: stats.total_spent || 0,
        todayViews: this.calculateTodayViews(stats.total_views || 0),
        conversionRate: this.calculateConversionRate(stats.total_views || 0, stats.active_ads || 0),
        lastUpdated: new Date()
      }
      
      this.notify({ type: 'dashboard', data: this.stats.dashboard })
    } catch (error) {
      // Only log errors if they're not authentication-related
      if (error.response?.status !== 401) {
        console.error('Error fetching dashboard stats:', error)
      }
    }
  }

  // Fetch ads statistics
  async fetchAdsStats() {
    if (!this.isAuthenticated || this.userRole !== 'advertiser') return
    
    try {
      const response = await api.get('/advertiser/ads')
      const ads = response.data.ads || []
      
      // ✅ Enhanced data calculation with proper validation
      const totalViews = ads.reduce((sum, ad) => {
        const views = parseInt(ad.views) || 0
        // ✅ Only count views for approved ads
        return sum + (ad.verification_status === 'approved' ? views : 0)
      }, 0)
      
      const totalSpent = ads.reduce((sum, ad) => {
        const spent = parseFloat(ad.spent) || 0
        // ✅ Only count spent for approved ads
        return sum + (ad.verification_status === 'approved' ? spent : 0)
      }, 0)
      
      // ✅ Count only verified active ads
      const activeAds = ads.filter(ad => 
        ad.status === 'active' && ad.verification_status === 'approved'
      ).length
      
      const pausedAds = ads.filter(ad => 
        ad.status === 'paused' && ad.verification_status === 'approved'
      ).length
      
      const completedAds = ads.filter(ad => 
        ad.status === 'completed' && ad.verification_status === 'approved'
      ).length
      
      // ✅ Add data validation and logging
      console.log('🔍 Real-time Stats - Calculated values:', {
        totalViews,
        totalSpent,
        activeAds,
        pausedAds,
        completedAds,
        adsCount: ads.length,
        verifiedAdsCount: ads.filter(ad => ad.verification_status === 'approved').length
      })
      
      this.stats.ads = {
        totalViews,
        totalSpent,
        activeAds,
        pausedAds,
        completedAds,
        averageROI: totalSpent > 0 ? (totalViews / totalSpent).toFixed(2) : 0,
        budgetAlerts: this.generateBudgetAlerts(ads),
        lastUpdated: new Date()
      }
      
      this.notify({ type: 'ads', data: this.stats.ads })
    } catch (error) {
      // Only log errors if they're not authentication-related
      if (error.response?.status !== 401) {
        console.error('Error fetching ads stats:', error)
      }
    }
  }

  // Fetch profile statistics
  async fetchProfileStats() {
    if (!this.isAuthenticated || this.userRole !== 'advertiser') return
    
    try {
      const [profileRes, statsRes] = await Promise.all([
        api.get('/advertiser/profile'),
        api.get('/advertiser/dashboard')
      ])
      
      const profile = profileRes.data
      const stats = statsRes.data.stats || {}
      
      this.stats.profile = {
        totalViews: stats.total_views || 0,
        activeAds: stats.active_ads || 0,
        totalSpent: stats.total_spent || 0,
        conversionRate: stats.total_views > 0 ? ((stats.active_ads / stats.total_ads) * 100).toFixed(2) : 0,
        averageROI: stats.total_spent > 0 ? (stats.total_views / stats.total_spent).toFixed(2) : 0,
        kycStatus: profile.kyc_status,
        lastUpdated: new Date()
      }
      
      this.notify({ type: 'profile', data: this.stats.profile })
    } catch (error) {
      // Only log errors if they're not authentication-related
      if (error.response?.status !== 401) {
        console.error('Error fetching profile stats:', error)
      }
    }
  }

  // Fetch credit statistics
  async fetchCreditStats() {
    if (!this.isAuthenticated || this.userRole !== 'advertiser') return
    
    try {
      const [creditRes, transactionsRes, statsRes] = await Promise.all([
        api.get('/advertiser/credit'),
        api.get('/api/wallet/transactions'),
        api.get('/advertiser/dashboard')
      ])
      
      const credit = creditRes.data.balance || 0
      const transactions = transactionsRes.data || []
      const stats = statsRes.data.stats || {}
      
      const totalSpent = stats.total_spent || 0
      const activeAds = stats.active_ads || 0
      const averageDailySpend = totalSpent > 0 ? (totalSpent / 30).toFixed(3) : 0
      const projectedMonthlySpend = parseFloat(averageDailySpend) * 30
      const creditUtilization = credit > 0 ? ((totalSpent / (credit + totalSpent)) * 100) : 0
      
      this.stats.credit = {
        currentBalance: credit,
        totalSpent,
        activeCampaigns: activeAds,
        averageDailySpend: parseFloat(averageDailySpend),
        projectedMonthlySpend,
        creditUtilization: parseFloat(creditUtilization.toFixed(2)),
        recentTransactions: transactions.slice(0, 5),
        creditAlerts: this.generateCreditAlerts(credit, totalSpent, activeAds),
        lastUpdated: new Date()
      }
      
      this.notify({ type: 'credit', data: this.stats.credit })
    } catch (error) {
      // Only log errors if they're not authentication-related
      if (error.response?.status !== 401) {
        console.error('Error fetching credit stats:', error)
      }
    }
  }

  // Fetch viewer profile statistics
  async fetchViewerProfileStats() {
    if (!this.isAuthenticated || this.userRole !== 'viewer') return
    
    try {
      const response = await api.get('/viewer/profile')
      const profile = response.data
      
      this.stats.profile = {
        name: profile.name || 'Unknown',
        phone: profile.phone || '',
        civilId: profile.civil_id || '',
        kycStatus: profile.kyc_status || 'pending',
        verifiedAt: profile.verified_at || null,
        totalVideosWatched: profile.total_videos_watched || 0,
        totalCreditsEarned: profile.total_credits_earned || 0,
        lastUpdated: new Date()
      }
      
      this.notify({ type: 'profile', data: this.stats.profile })
    } catch (error) {
      // Only log errors if they're not authentication-related
      if (error.response?.status !== 401) {
        console.error('Error fetching viewer profile stats:', error)
      }
    }
  }

  // Fetch viewer credit statistics
  async fetchViewerCreditStats() {
    if (!this.isAuthenticated || this.userRole !== 'viewer') return
    
    try {
      const [walletRes, transactionsRes] = await Promise.all([
        api.get('/api/wallet'),
        api.get('/api/wallet/transactions')
      ])
      
      const balance = walletRes.data.balance || 0
      const transactions = transactionsRes.data || []
      
      // Calculate viewer-specific metrics
      const totalEarned = transactions
        .filter(t => t.type === 'credit' && t.amount > 0)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
      
      const totalWithdrawn = transactions
        .filter(t => t.type === 'debit' && t.amount > 0)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
      
      const availableForWithdrawal = balance
      const pendingCredits = totalEarned - totalWithdrawn - balance
      
      this.stats.credit = {
        currentBalance: balance,
        totalEarned,
        totalWithdrawn,
        availableForWithdrawal,
        pendingCredits: Math.max(0, pendingCredits),
        recentTransactions: transactions.slice(0, 5),
        lastUpdated: new Date()
      }
      
      this.notify({ type: 'credit', data: this.stats.credit })
    } catch (error) {
      // Only log errors if they're not authentication-related
      if (error.response?.status !== 401) {
        console.error('Error fetching viewer credit stats:', error)
      }
    }
  }

  // Calculate today's views (simulated - replace with real API)
  calculateTodayViews(totalViews) {
    return Math.floor(Math.random() * 50) + 20
  }

  // Calculate conversion rate
  calculateConversionRate(totalViews, activeAds) {
    if (totalViews === 0) return 0
    return ((activeAds / totalViews) * 100).toFixed(2)
  }

  // Generate budget alerts for ads
  generateBudgetAlerts(ads) {
    return ads.filter(ad => {
      const budgetUsage = (ad.spent / ad.budget) * 100
      return budgetUsage > 80 && ad.status === 'active'
    }).map(ad => ({
      id: ad.id,
      title: ad.title,
      usage: ((ad.spent / ad.budget) * 100).toFixed(1)
    }))
  }

  // Generate credit alerts
  generateCreditAlerts(credit, totalSpent, activeAds) {
    const alerts = []
    
    if (credit < 5) {
      alerts.push({
        type: 'critical',
        message: 'Credit balance is critically low. Add funds to continue campaigns.',
        severity: 'error'
      })
    } else if (credit < 20) {
      alerts.push({
        type: 'warning',
        message: 'Credit balance is running low. Consider adding funds.',
        severity: 'warning'
      })
    }

    if (totalSpent > 0 && activeAds > 0) {
      const averageDailySpend = totalSpent / 30
      const projectedMonthlySpend = averageDailySpend * 30
      const utilization = (totalSpent / (credit + totalSpent)) * 100

      if (utilization > 80) {
        alerts.push({
          type: 'info',
          message: 'High credit utilization detected. Monitor spending closely.',
          severity: 'info'
        })
      }
    }

    return alerts
  }

  // Get current stats
  getStats() {
    return this.stats
  }

  // Get specific stat type
  getStat(type) {
    return this.stats[type]
  }

  // Check if service is running
  isActive() {
    return this.isRunning
  }

  // Manual refresh of specific stat type
  async refreshStat(type) {
    if (!this.isAuthenticated) return

    switch (type) {
      case 'dashboard':
        if (this.userRole === 'advertiser') {
          await this.fetchDashboardStats()
        }
        break
      case 'ads':
        if (this.userRole === 'advertiser') {
          await this.fetchAdsStats()
        }
        break
      case 'profile':
        if (this.userRole === 'advertiser') {
          await this.fetchProfileStats()
        } else if (this.userRole === 'viewer') {
          await this.fetchViewerProfileStats()
        }
        break
      case 'credit':
        if (this.userRole === 'advertiser') {
          await this.fetchCreditStats()
        } else if (this.userRole === 'viewer') {
          await this.fetchViewerCreditStats()
        }
        break
      default:
        await this.fetchAllStats()
    }
  }
}

// Create singleton instance
const realTimeStatsService = new RealTimeStatsService()

export default realTimeStatsService
