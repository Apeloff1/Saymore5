// ========== GO FISH! SOCIAL & MULTIPLAYER SYSTEM ==========
// Comprehensive social features, leaderboards, and multiplayer functionality
// ~1200+ lines of social systems

// ========== LEADERBOARD SYSTEM ==========

/**
 * Global and friend leaderboards
 */
class LeaderboardSystem {
  constructor() {
    this.leaderboards = {
      global: {
        allTime: { score: [], fish: [], level: [], perfectCatches: [] },
        weekly: { score: [], fish: [], level: [], perfectCatches: [] },
        daily: { score: [], fish: [], level: [], perfectCatches: [] },
      },
      friends: {
        allTime: { score: [], fish: [], level: [], perfectCatches: [] },
        weekly: { score: [], fish: [], level: [], perfectCatches: [] },
      },
      seasonal: {
        current: { score: [], fish: [], specialFish: [] },
      },
    };
    
    this.playerRanks = {};
    this.lastUpdate = null;
    this.updateInterval = 60000; // 1 minute
    
    this.listeners = [];
  }
  
  /**
   * Submit score to leaderboard
   */
  submitScore(playerId, playerName, category, score, metadata = {}) {
    const entry = {
      playerId,
      playerName,
      score,
      timestamp: Date.now(),
      rank: 0,
      ...metadata,
    };
    
    // Update all time
    this.updateLeaderboardCategory('global', 'allTime', category, entry);
    
    // Update weekly
    this.updateLeaderboardCategory('global', 'weekly', category, entry);
    
    // Update daily
    this.updateLeaderboardCategory('global', 'daily', category, entry);
    
    // Calculate new rank
    const newRank = this.getPlayerRank(playerId, 'global', 'allTime', category);
    
    this.notifyListeners('scoreSubmitted', { entry, rank: newRank });
    
    return newRank;
  }
  
  /**
   * Update a specific leaderboard category
   */
  updateLeaderboardCategory(scope, period, category, entry) {
    const board = this.leaderboards[scope]?.[period]?.[category];
    if (!board) return;
    
    // Find existing entry
    const existingIndex = board.findIndex(e => e.playerId === entry.playerId);
    
    if (existingIndex >= 0) {
      // Update if new score is higher
      if (entry.score > board[existingIndex].score) {
        board[existingIndex] = entry;
      }
    } else {
      board.push(entry);
    }
    
    // Sort by score (descending)
    board.sort((a, b) => b.score - a.score);
    
    // Limit to top 1000
    if (board.length > 1000) {
      board.length = 1000;
    }
    
    // Update ranks
    board.forEach((e, i) => {
      e.rank = i + 1;
    });
  }
  
  /**
   * Get player's rank
   */
  getPlayerRank(playerId, scope, period, category) {
    const board = this.leaderboards[scope]?.[period]?.[category];
    if (!board) return null;
    
    const entry = board.find(e => e.playerId === playerId);
    return entry ? entry.rank : null;
  }
  
  /**
   * Get top entries
   */
  getTopEntries(scope, period, category, limit = 100) {
    const board = this.leaderboards[scope]?.[period]?.[category];
    if (!board) return [];
    
    return board.slice(0, limit).map(e => ({ ...e }));
  }
  
  /**
   * Get entries around player
   */
  getEntriesAroundPlayer(playerId, scope, period, category, range = 5) {
    const board = this.leaderboards[scope]?.[period]?.[category];
    if (!board) return [];
    
    const playerIndex = board.findIndex(e => e.playerId === playerId);
    if (playerIndex < 0) return [];
    
    const start = Math.max(0, playerIndex - range);
    const end = Math.min(board.length, playerIndex + range + 1);
    
    return board.slice(start, end).map(e => ({ ...e }));
  }
  
  /**
   * Reset periodic leaderboards
   */
  resetPeriodic(period) {
    const scopes = ['global', 'friends'];
    const categories = ['score', 'fish', 'level', 'perfectCatches'];
    
    scopes.forEach(scope => {
      if (this.leaderboards[scope]?.[period]) {
        categories.forEach(cat => {
          if (this.leaderboards[scope][period][cat]) {
            this.leaderboards[scope][period][cat] = [];
          }
        });
      }
    });
    
    this.notifyListeners('leaderboardReset', { period });
  }
  
  /**
   * Get leaderboard summary
   */
  getSummary(playerId) {
    return {
      globalScoreRank: this.getPlayerRank(playerId, 'global', 'allTime', 'score'),
      globalFishRank: this.getPlayerRank(playerId, 'global', 'allTime', 'fish'),
      weeklyScoreRank: this.getPlayerRank(playerId, 'global', 'weekly', 'score'),
      dailyScoreRank: this.getPlayerRank(playerId, 'global', 'daily', 'score'),
    };
  }
  
  // Event system
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
  
  notifyListeners(event, data) {
    this.listeners.forEach(l => l(event, data));
  }
}

// ========== FRIEND SYSTEM ==========

/**
 * Friend management and social features
 */
class FriendSystem {
  constructor() {
    this.friends = [];
    this.pendingRequests = [];
    this.blockedUsers = [];
    this.onlineFriends = new Set();
    
    this.listeners = [];
  }
  
  /**
   * Send friend request
   */
  sendFriendRequest(toUserId, fromUser) {
    const request = {
      id: `fr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: fromUser,
      to: toUserId,
      status: 'pending',
      sentAt: Date.now(),
    };
    
    this.pendingRequests.push(request);
    this.notifyListeners('friendRequestSent', request);
    
    return request;
  }
  
  /**
   * Accept friend request
   */
  acceptFriendRequest(requestId) {
    const requestIndex = this.pendingRequests.findIndex(r => r.id === requestId);
    if (requestIndex < 0) return null;
    
    const request = this.pendingRequests[requestIndex];
    request.status = 'accepted';
    
    // Add to friends list
    const friendship = {
      id: `f_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user: request.from,
      since: Date.now(),
      interactions: 0,
      lastInteraction: null,
    };
    
    this.friends.push(friendship);
    this.pendingRequests.splice(requestIndex, 1);
    
    this.notifyListeners('friendRequestAccepted', { request, friendship });
    
    return friendship;
  }
  
  /**
   * Reject friend request
   */
  rejectFriendRequest(requestId) {
    const requestIndex = this.pendingRequests.findIndex(r => r.id === requestId);
    if (requestIndex < 0) return null;
    
    const request = this.pendingRequests.splice(requestIndex, 1)[0];
    request.status = 'rejected';
    
    this.notifyListeners('friendRequestRejected', request);
    
    return request;
  }
  
  /**
   * Remove friend
   */
  removeFriend(friendshipId) {
    const index = this.friends.findIndex(f => f.id === friendshipId);
    if (index < 0) return null;
    
    const removed = this.friends.splice(index, 1)[0];
    this.notifyListeners('friendRemoved', removed);
    
    return removed;
  }
  
  /**
   * Block user
   */
  blockUser(userId) {
    if (!this.blockedUsers.includes(userId)) {
      this.blockedUsers.push(userId);
      
      // Remove from friends if exists
      const friendIndex = this.friends.findIndex(f => f.user.id === userId);
      if (friendIndex >= 0) {
        this.friends.splice(friendIndex, 1);
      }
      
      this.notifyListeners('userBlocked', { userId });
    }
  }
  
  /**
   * Unblock user
   */
  unblockUser(userId) {
    const index = this.blockedUsers.indexOf(userId);
    if (index >= 0) {
      this.blockedUsers.splice(index, 1);
      this.notifyListeners('userUnblocked', { userId });
    }
  }
  
  /**
   * Update online status
   */
  updateOnlineStatus(userId, isOnline) {
    if (isOnline) {
      this.onlineFriends.add(userId);
    } else {
      this.onlineFriends.delete(userId);
    }
    
    this.notifyListeners('onlineStatusChanged', { userId, isOnline });
  }
  
  /**
   * Get friends list with status
   */
  getFriendsList() {
    return this.friends.map(f => ({
      ...f,
      isOnline: this.onlineFriends.has(f.user.id),
    }));
  }
  
  /**
   * Get online friends
   */
  getOnlineFriends() {
    return this.friends.filter(f => this.onlineFriends.has(f.user.id));
  }
  
  /**
   * Record interaction with friend
   */
  recordInteraction(friendshipId) {
    const friend = this.friends.find(f => f.id === friendshipId);
    if (friend) {
      friend.interactions++;
      friend.lastInteraction = Date.now();
    }
  }
  
  // Event system
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
  
  notifyListeners(event, data) {
    this.listeners.forEach(l => l(event, data));
  }
}

// ========== ACTIVITY FEED SYSTEM ==========

/**
 * Social activity feed
 */
class ActivityFeed {
  constructor() {
    this.activities = [];
    this.maxActivities = 1000;
    this.filters = {
      showOwnActivities: true,
      showFriendActivities: true,
      showGlobalHighlights: true,
    };
    
    this.activityTypes = {
      CATCH: 'catch',
      ACHIEVEMENT: 'achievement',
      LEVEL_UP: 'level_up',
      RECORD: 'record',
      CHALLENGE_COMPLETE: 'challenge_complete',
      PRESTIGE: 'prestige',
      RARE_CATCH: 'rare_catch',
      LEGENDARY_CATCH: 'legendary_catch',
      PERFECT_STREAK: 'perfect_streak',
    };
    
    this.listeners = [];
  }
  
  /**
   * Add activity to feed
   */
  addActivity(type, user, data, visibility = 'friends') {
    const activity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      user,
      data,
      visibility,
      timestamp: Date.now(),
      likes: 0,
      likedBy: [],
      comments: [],
    };
    
    this.activities.unshift(activity);
    
    // Trim old activities
    if (this.activities.length > this.maxActivities) {
      this.activities.length = this.maxActivities;
    }
    
    this.notifyListeners('activityAdded', activity);
    
    return activity;
  }
  
  /**
   * Like an activity
   */
  likeActivity(activityId, userId) {
    const activity = this.activities.find(a => a.id === activityId);
    if (!activity) return null;
    
    if (!activity.likedBy.includes(userId)) {
      activity.likedBy.push(userId);
      activity.likes++;
      this.notifyListeners('activityLiked', { activityId, userId });
    }
    
    return activity;
  }
  
  /**
   * Unlike an activity
   */
  unlikeActivity(activityId, userId) {
    const activity = this.activities.find(a => a.id === activityId);
    if (!activity) return null;
    
    const index = activity.likedBy.indexOf(userId);
    if (index >= 0) {
      activity.likedBy.splice(index, 1);
      activity.likes--;
      this.notifyListeners('activityUnliked', { activityId, userId });
    }
    
    return activity;
  }
  
  /**
   * Add comment to activity
   */
  addComment(activityId, userId, userName, text) {
    const activity = this.activities.find(a => a.id === activityId);
    if (!activity) return null;
    
    const comment = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName,
      text,
      timestamp: Date.now(),
    };
    
    activity.comments.push(comment);
    this.notifyListeners('commentAdded', { activityId, comment });
    
    return comment;
  }
  
  /**
   * Get filtered feed
   */
  getFeed(userId, friendIds = [], options = {}) {
    const { limit = 50, offset = 0, types = null } = options;
    
    let filtered = this.activities.filter(activity => {
      // Type filter
      if (types && !types.includes(activity.type)) return false;
      
      // Visibility filter
      if (activity.visibility === 'private' && activity.user.id !== userId) return false;
      if (activity.visibility === 'friends') {
        if (activity.user.id !== userId && !friendIds.includes(activity.user.id)) return false;
      }
      
      // User preferences
      if (!this.filters.showOwnActivities && activity.user.id === userId) return false;
      if (!this.filters.showFriendActivities && friendIds.includes(activity.user.id)) return false;
      if (!this.filters.showGlobalHighlights && activity.visibility === 'global') return false;
      
      return true;
    });
    
    return filtered.slice(offset, offset + limit);
  }
  
  /**
   * Get user's activities
   */
  getUserActivities(userId, limit = 20) {
    return this.activities
      .filter(a => a.user.id === userId)
      .slice(0, limit);
  }
  
  /**
   * Generate activity message
   */
  getActivityMessage(activity) {
    const { type, user, data } = activity;
    
    switch (type) {
      case this.activityTypes.CATCH:
        return `${user.name} caught a ${data.fishName}!`;
      case this.activityTypes.ACHIEVEMENT:
        return `${user.name} unlocked "${data.achievementName}"!`;
      case this.activityTypes.LEVEL_UP:
        return `${user.name} reached level ${data.level}!`;
      case this.activityTypes.RECORD:
        return `${user.name} set a new personal record: ${data.recordType}!`;
      case this.activityTypes.CHALLENGE_COMPLETE:
        return `${user.name} completed the "${data.challengeName}" challenge!`;
      case this.activityTypes.PRESTIGE:
        return `${user.name} prestiged to level ${data.prestigeLevel}! 🌟`;
      case this.activityTypes.RARE_CATCH:
        return `${user.name} caught a rare ${data.fishName}! 💎`;
      case this.activityTypes.LEGENDARY_CATCH:
        return `${user.name} caught a LEGENDARY ${data.fishName}! 👑`;
      case this.activityTypes.PERFECT_STREAK:
        return `${user.name} got ${data.streak} perfect catches in a row! ✨`;
      default:
        return `${user.name} did something amazing!`;
    }
  }
  
  // Event system
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
  
  notifyListeners(event, data) {
    this.listeners.forEach(l => l(event, data));
  }
}

// ========== TOURNAMENT SYSTEM ==========

/**
 * Competitive fishing tournaments
 */
class TournamentSystem {
  constructor() {
    this.activeTournaments = [];
    this.completedTournaments = [];
    this.playerStats = {};
    
    this.tournamentTypes = {
      DAILY: 'daily',
      WEEKLY: 'weekly',
      SPECIAL: 'special',
      SEASONAL: 'seasonal',
    };
    
    this.listeners = [];
  }
  
  /**
   * Create a new tournament
   */
  createTournament(config) {
    const tournament = {
      id: `tour_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: config.name,
      description: config.description,
      type: config.type,
      startTime: config.startTime,
      endTime: config.endTime,
      entryFee: config.entryFee || 0,
      prizePool: config.prizePool || [],
      rules: config.rules || {},
      participants: [],
      scores: {},
      status: 'upcoming',
      maxParticipants: config.maxParticipants || Infinity,
    };
    
    this.activeTournaments.push(tournament);
    this.notifyListeners('tournamentCreated', tournament);
    
    return tournament;
  }
  
  /**
   * Join a tournament
   */
  joinTournament(tournamentId, player) {
    const tournament = this.activeTournaments.find(t => t.id === tournamentId);
    if (!tournament) return { success: false, error: 'Tournament not found' };
    
    if (tournament.status !== 'upcoming' && tournament.status !== 'active') {
      return { success: false, error: 'Tournament is not accepting participants' };
    }
    
    if (tournament.participants.length >= tournament.maxParticipants) {
      return { success: false, error: 'Tournament is full' };
    }
    
    if (tournament.participants.find(p => p.id === player.id)) {
      return { success: false, error: 'Already joined' };
    }
    
    tournament.participants.push({
      id: player.id,
      name: player.name,
      joinedAt: Date.now(),
    });
    
    tournament.scores[player.id] = {
      score: 0,
      fishCaught: 0,
      biggestFish: 0,
      perfectCatches: 0,
    };
    
    this.notifyListeners('playerJoinedTournament', { tournament, player });
    
    return { success: true, tournament };
  }
  
  /**
   * Submit tournament score
   */
  submitTournamentScore(tournamentId, playerId, scoreData) {
    const tournament = this.activeTournaments.find(t => t.id === tournamentId);
    if (!tournament || tournament.status !== 'active') return null;
    
    const playerScore = tournament.scores[playerId];
    if (!playerScore) return null;
    
    // Update scores based on tournament rules
    playerScore.score += scoreData.points || 0;
    playerScore.fishCaught += scoreData.fishCaught || 0;
    playerScore.biggestFish = Math.max(playerScore.biggestFish, scoreData.fishSize || 0);
    playerScore.perfectCatches += scoreData.perfectCatch ? 1 : 0;
    
    this.notifyListeners('tournamentScoreUpdated', { tournamentId, playerId, score: playerScore });
    
    return playerScore;
  }
  
  /**
   * Get tournament rankings
   */
  getTournamentRankings(tournamentId) {
    const tournament = this.activeTournaments.find(t => t.id === tournamentId) ||
                      this.completedTournaments.find(t => t.id === tournamentId);
    if (!tournament) return [];
    
    const rankings = Object.entries(tournament.scores)
      .map(([playerId, score]) => ({
        playerId,
        playerName: tournament.participants.find(p => p.id === playerId)?.name || 'Unknown',
        ...score,
      }))
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
    
    return rankings;
  }
  
  /**
   * End tournament and distribute prizes
   */
  endTournament(tournamentId) {
    const tournamentIndex = this.activeTournaments.findIndex(t => t.id === tournamentId);
    if (tournamentIndex < 0) return null;
    
    const tournament = this.activeTournaments[tournamentIndex];
    tournament.status = 'completed';
    tournament.completedAt = Date.now();
    
    // Calculate final rankings
    tournament.finalRankings = this.getTournamentRankings(tournamentId);
    
    // Distribute prizes
    tournament.prizeDistribution = this.distributePrizes(tournament);
    
    // Move to completed
    this.activeTournaments.splice(tournamentIndex, 1);
    this.completedTournaments.push(tournament);
    
    // Trim completed tournaments
    if (this.completedTournaments.length > 100) {
      this.completedTournaments.shift();
    }
    
    this.notifyListeners('tournamentEnded', tournament);
    
    return tournament;
  }
  
  /**
   * Distribute tournament prizes
   */
  distributePrizes(tournament) {
    const distribution = [];
    const { prizePool, finalRankings } = tournament;
    
    prizePool.forEach((prize, index) => {
      if (finalRankings[index]) {
        distribution.push({
          playerId: finalRankings[index].playerId,
          playerName: finalRankings[index].playerName,
          rank: index + 1,
          prize,
        });
      }
    });
    
    return distribution;
  }
  
  /**
   * Update tournament status
   */
  updateTournamentStatus() {
    const now = Date.now();
    
    this.activeTournaments.forEach(tournament => {
      if (tournament.status === 'upcoming' && now >= tournament.startTime) {
        tournament.status = 'active';
        this.notifyListeners('tournamentStarted', tournament);
      }
      
      if (tournament.status === 'active' && now >= tournament.endTime) {
        this.endTournament(tournament.id);
      }
    });
  }
  
  /**
   * Get active tournaments
   */
  getActiveTournaments() {
    return this.activeTournaments.map(t => ({
      ...t,
      participantCount: t.participants.length,
      timeRemaining: t.endTime - Date.now(),
    }));
  }
  
  // Event system
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
  
  notifyListeners(event, data) {
    this.listeners.forEach(l => l(event, data));
  }
}

// ========== GIFT SYSTEM ==========

/**
 * Send gifts between players
 */
class GiftSystem {
  constructor() {
    this.giftHistory = [];
    this.pendingGifts = [];
    
    this.giftTypes = {
      COINS: 'coins',
      LURE: 'lure',
      BAIT: 'bait',
      BOOST: 'boost',
      COSMETIC: 'cosmetic',
    };
    
    this.listeners = [];
  }
  
  /**
   * Send a gift
   */
  sendGift(fromUser, toUserId, giftType, giftData) {
    const gift = {
      id: `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: fromUser,
      to: toUserId,
      type: giftType,
      data: giftData,
      sentAt: Date.now(),
      status: 'pending',
      message: giftData.message || '',
    };
    
    this.pendingGifts.push(gift);
    this.notifyListeners('giftSent', gift);
    
    return gift;
  }
  
  /**
   * Claim a gift
   */
  claimGift(giftId, userId) {
    const giftIndex = this.pendingGifts.findIndex(g => g.id === giftId && g.to === userId);
    if (giftIndex < 0) return null;
    
    const gift = this.pendingGifts[giftIndex];
    gift.status = 'claimed';
    gift.claimedAt = Date.now();
    
    this.pendingGifts.splice(giftIndex, 1);
    this.giftHistory.push(gift);
    
    this.notifyListeners('giftClaimed', gift);
    
    return gift;
  }
  
  /**
   * Get pending gifts for user
   */
  getPendingGifts(userId) {
    return this.pendingGifts.filter(g => g.to === userId);
  }
  
  /**
   * Get gift history
   */
  getGiftHistory(userId, type = 'all') {
    return this.giftHistory.filter(g => {
      if (type === 'sent') return g.from.id === userId;
      if (type === 'received') return g.to === userId;
      return g.from.id === userId || g.to === userId;
    });
  }
  
  // Event system
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
  
  notifyListeners(event, data) {
    this.listeners.forEach(l => l(event, data));
  }
}

// ========== EXPORTS ==========

export {
  LeaderboardSystem,
  FriendSystem,
  ActivityFeed,
  TournamentSystem,
  GiftSystem,
};

export default {
  LeaderboardSystem,
  FriendSystem,
  ActivityFeed,
  TournamentSystem,
  GiftSystem,
};
