package com.rork.shikshasetu.services

import com.rork.shikshasetu.models.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class AppService(
    private val storage: StorageService,
    private val authService: AuthService
) {
    private val _userRole = MutableStateFlow<String?>(null)
    val userRole: StateFlow<String?> = _userRole.asStateFlow()

    private val _selectedLanguage = MutableStateFlow("english")
    val selectedLanguage: StateFlow<String> = _selectedLanguage.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _userProgress = MutableStateFlow(UserProgress())
    val userProgress: StateFlow<UserProgress> = _userProgress.asStateFlow()

    private val _xpRewardActive = MutableStateFlow(false)
    val xpRewardActive: StateFlow<Boolean> = _xpRewardActive.asStateFlow()

    private val _aiUsage = MutableStateFlow(AIUsageState())
    val aiUsage: StateFlow<AIUsageState> = _aiUsage.asStateFlow()

    fun initialize() {
        _userRole.value = storage.loadRole()
        _selectedLanguage.value = storage.loadLanguage()
        val progress = storage.loadProgress() ?: UserProgress()
        _userProgress.value = progress
        _aiUsage.value = storage.loadAIUsage()

        updateStreak(progress.lastActiveDate)
        _isLoading.value = false
    }

    fun reinitializeForUser() {
        _userRole.value = null
        _selectedLanguage.value = "english"
        _userProgress.value = UserProgress()
        _isLoading.value = true
        _userRole.value = storage.loadRole()
        _selectedLanguage.value = storage.loadLanguage()
        val progress = storage.loadProgress() ?: UserProgress()
        _userProgress.value = progress
        _aiUsage.value = storage.loadAIUsage()
        if (progress.lastActiveDate.isNotBlank()) {
            updateStreak(progress.lastActiveDate)
        }
        _isLoading.value = false
    }

    fun selectRole(role: String) {
        _userRole.value = role
        storage.saveRole(role)
    }

    fun changeLanguage(language: String) {
        _selectedLanguage.value = language
        storage.saveLanguage(language)
    }

    fun addXP(amount: Int, reason: String) {
        val prev = _userProgress.value
        val entry = XPEntry(
            id = System.currentTimeMillis().toString(),
            amount = amount,
            reason = reason
        )
        val newTotalXP = prev.totalXP + amount
        var xpReward = prev.xpReward

        if (xpReward != null && java.util.Date().after(
                java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault())
                    .parse(xpReward.expiresAt))
        ) {
            xpReward = null
        }

        if (xpReward == null && newTotalXP >= 10000) {
            val now = java.util.Date()
            val expires = java.util.Date(now.time + 30L * 24 * 60 * 60 * 1000)
            val fmt = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault())
            xpReward = XPReward(
                active = true,
                activatedAt = fmt.format(now),
                expiresAt = fmt.format(expires)
            )
        }

        val updated = prev.copy(
            totalXP = newTotalXP,
            xpHistory = prev.xpHistory + entry,
            xpReward = xpReward
        )
        _userProgress.value = updated
        persistProgress()
    }

    fun addQuizResult(result: QuizResult) {
        val prev = _userProgress.value
        _userProgress.value = prev.copy(quizzesCompleted = prev.quizzesCompleted + result)
        updateStreak(prev.lastActiveDate)
        persistProgress()
    }

    fun addContentActivity(activity: ContentActivity) {
        val prev = _userProgress.value
        _userProgress.value = prev.copy(contentActivities = prev.contentActivities + activity)
        updateStreak(prev.lastActiveDate)
        persistProgress()
    }

    fun addStudyTime(minutes: Int) {
        val prev = _userProgress.value
        _userProgress.value = prev.copy(totalStudyTime = prev.totalStudyTime + minutes)
        persistProgress()
    }

    fun addTeacherActivity(activity: TeacherActivity) {
        val prev = _userProgress.value
        _userProgress.value = prev.copy(teacherActivities = prev.teacherActivities + activity)
        updateStreak(prev.lastActiveDate)
        persistProgress()
    }

    fun addTeacherUpload(upload: TeacherUpload) {
        val prev = _userProgress.value
        _userProgress.value = prev.copy(teacherUploads = prev.teacherUploads + upload)
        persistProgress()
    }

    fun recordGamePlay(game: String, won: Boolean) {
        val today = todayString()
        val prev = _userProgress.value
        val record = GamePlayRecord(date = today, game = game, won = won)

        val funLearning = if (prev.funLearning.lastPlayDate == today) {
            prev.funLearning
        } else {
            FunLearningState(lastPlayDate = today)
        }

        val updatedGames = funLearning.gamePlaysToday + record
        var pendingXPLoss = funLearning.pendingXPLoss
        var newXP = prev.totalXP
        var newHistory = prev.xpHistory

        if (!won) {
            pendingXPLoss = true
            newXP = maxOf(0, newXP - 1)
            val gameNames = mapOf(
                "pacman" to "Pacman", "flappy" to "Jumping Fox",
                "tictactoe" to "Tic-Tac-Toe", "runner" to "Classroom Runner"
            )
            newHistory = newHistory + XPEntry(
                id = System.currentTimeMillis().toString(),
                amount = -1,
                reason = "Lost ${gameNames[game] ?: game} game"
            )
        }

        _userProgress.value = prev.copy(
            totalXP = newXP,
            xpHistory = newHistory,
            funLearning = funLearning.copy(
                gamePlaysToday = updatedGames,
                pendingXPLoss = pendingXPLoss
            )
        )
        persistProgress()
    }

    fun recordGKQuiz(score: Int, totalQuestions: Int) {
        val today = todayString()
        val prev = _userProgress.value
        val record = GKQuizRecord(date = today, score = score, totalQuestions = totalQuestions)

        val funLearning = if (prev.funLearning.lastPlayDate == today) {
            prev.funLearning
        } else {
            FunLearningState(lastPlayDate = today)
        }

        var newXP = prev.totalXP
        var newHistory = prev.xpHistory
        var pendingXPLoss = funLearning.pendingXPLoss

        if (score >= 3 && pendingXPLoss) {
            pendingXPLoss = false
            newXP += 1
            newHistory = newHistory + XPEntry(
                id = System.currentTimeMillis().toString(),
                amount = 1,
                reason = "GK Quiz reimbursement (+1 XP)"
            )
        }

        _userProgress.value = prev.copy(
            totalXP = newXP,
            xpHistory = newHistory,
            funLearning = funLearning.copy(
                gkQuizzesToday = funLearning.gkQuizzesToday + record,
                pendingXPLoss = pendingXPLoss
            )
        )
        persistProgress()
    }

    fun canPlayGame(game: String): Boolean {
        val today = todayString()
        val fl = _userProgress.value.funLearning
        if (fl.lastPlayDate != today) return true
        return !fl.gamePlaysToday.any { it.game == game }
    }

    fun getOnboardingData(): OnboardingData? = storage.loadOnboardingData()
    fun saveOnboardingData(data: OnboardingData) = storage.saveOnboardingData(data)
    fun saveOnboardingDone() = storage.saveOnboardingDone()
    fun isOnboardingDone(): Boolean = storage.isOnboardingDone()

    val isPremium: Boolean get() = authService.isPremium

    val aiDailyLimit: Int get() = if (isPremium) 10 else 5
    val aiUsedToday: Int get() {
        val usage = _aiUsage.value
        return if (usage.date == todayString()) usage.count else 0
    }
    val aiRemaining: Int get() = maxOf(0, aiDailyLimit - aiUsedToday)

    fun canUseAI(): Boolean = aiRemaining > 0

    fun incrementAIUsage() {
        val today = todayString()
        val prev = _aiUsage.value
        val next = if (prev.date == today) {
            prev.copy(count = prev.count + 1)
        } else {
            AIUsageState(date = today, count = 1)
        }
        _aiUsage.value = next
        storage.saveAIUsage(next)
    }

    private fun updateStreak(lastActive: String) {
        val today = todayString()
        val yesterday = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault())
            .format(java.util.Date(System.currentTimeMillis() - 86400000))

        val prev = _userProgress.value

        if (lastActive == today) return

        val newStreak = when (lastActive) {
            yesterday -> prev.currentStreak + 1
            else -> 1
        }

        var updatedXP = prev.totalXP
        var updatedHistory = prev.xpHistory
        val updatedStreakXPAwarded = prev.streakXPAwarded.toMutableList()

        if (newStreak >= 7 && newStreak % 7 == 0) {
            val streakKey = "${today}_$newStreak"
            if (!updatedStreakXPAwarded.contains(streakKey)) {
                updatedXP += 3
                updatedHistory = updatedHistory + XPEntry(
                    id = System.currentTimeMillis().toString(),
                    amount = 3,
                    reason = "7-day streak bonus!"
                )
                updatedStreakXPAwarded.add(streakKey)
            }
        }

        val funLearning = if (prev.funLearning.lastPlayDate == today) {
            prev.funLearning
        } else {
            FunLearningState(lastPlayDate = today)
        }

        _userProgress.value = prev.copy(
            currentStreak = newStreak,
            lastActiveDate = today,
            totalXP = updatedXP,
            xpHistory = updatedHistory,
            streakXPAwarded = updatedStreakXPAwarded,
            funLearning = funLearning
        )
        persistProgress()
    }

    private fun persistProgress() {
        storage.saveProgress(_userProgress.value)
    }
}
