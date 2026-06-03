package com.rork.shikshasetu.services

import com.rork.shikshasetu.AppConfig
import com.rork.shikshasetu.models.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlin.random.Random

data class AuthResult(
    val success: Boolean,
    val error: String? = null,
    val authCode: String? = null,
    val isNewUser: Boolean = false
)

class AuthService(private val storage: StorageService) {
    private val _user = MutableStateFlow<ShikshaUser?>(null)
    val user: StateFlow<ShikshaUser?> = _user.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _lastAuthCode = MutableStateFlow<String?>(null)
    val lastAuthCode: StateFlow<String?> = _lastAuthCode.asStateFlow()

    fun initialize() {
        _user.value = storage.loadUser()
        _isLoading.value = false
    }

    suspend fun signUp(email: String, password: String, name: String): AuthResult {
        val normalizedEmail = email.trim().lowercase()
        val users = storage.loadUsers().toMutableMap()

        if (users.containsKey(normalizedEmail)) {
            return AuthResult(false, "Email already registered. Please sign in instead.")
        }

        val authCode = generateUniqueAuthCode()
        users[normalizedEmail] = StoredUser(password, name, authCode)
        storage.saveUsers(users)

        val authCodes = storage.loadAuthCodes().toMutableMap()
        authCodes[authCode] = normalizedEmail
        storage.saveAuthCodes(authCodes)

        val loggedInUser = ShikshaUser(normalizedEmail, name, authCode = authCode)
        _user.value = loggedInUser
        _lastAuthCode.value = authCode
        storage.saveUser(loggedInUser)

        return AuthResult(true, authCode = authCode, isNewUser = true)
    }

    suspend fun signIn(email: String, password: String): AuthResult {
        val normalizedEmail = email.trim().lowercase()
        val users = storage.loadUsers()

        if (!users.containsKey(normalizedEmail)) {
            return AuthResult(false, "No account found with this email. Please sign up.")
        }

        val record = users[normalizedEmail]!!
        if (record.password != password) {
            return AuthResult(false, "Incorrect password. Please try again.")
        }

        var authCode = record.authCode
        if (authCode == null) {
            authCode = generateUniqueAuthCode()
            val updatedUsers = users.toMutableMap()
            updatedUsers[normalizedEmail] = record.copy(authCode = authCode)
            storage.saveUsers(updatedUsers)

            val authCodes = storage.loadAuthCodes().toMutableMap()
            authCodes[authCode] = normalizedEmail
            storage.saveAuthCodes(authCodes)
        }

        val loggedInUser = ShikshaUser(normalizedEmail, record.name, authCode = authCode)
        _user.value = loggedInUser
        _lastAuthCode.value = authCode
        storage.saveUser(loggedInUser)

        return AuthResult(true, authCode = authCode, isNewUser = false)
    }

    suspend fun signInWithCode(code: String): AuthResult {
        val authCodes = storage.loadAuthCodes()
        val email = authCodes[code] ?: return AuthResult(false, "Invalid auth code")

        val users = storage.loadUsers()
        val record = users[email] ?: return AuthResult(false, "User not found")

        val loggedInUser = ShikshaUser(email, record.name, authCode = code)
        _user.value = loggedInUser
        _lastAuthCode.value = code
        storage.saveUser(loggedInUser)

        return AuthResult(true)
    }

    suspend fun signOut() {
        _user.value = null
        _lastAuthCode.value = null
        storage.clearUser()
    }

    suspend fun continueAsGuest(): AuthResult {
        val guestUser = ShikshaUser("guest@app.com", "Guest", isGuest = true)
        _user.value = guestUser
        storage.saveUser(guestUser)
        return AuthResult(true)
    }

    val isPremium: Boolean
        get() {
            val email = _user.value?.email?.lowercase() ?: return false
            return AppConfig.PREMIUM_EMAILS.contains(email)
        }

    private suspend fun generateUniqueAuthCode(): String {
        val existingCodes = storage.loadAuthCodes()
        repeat(100) {
            val code = String.format("%04d", Random.nextInt(10000))
            if (!existingCodes.containsKey(code)) return code
        }
        return String.format("%04d", Random.nextInt(10000))
    }
}
