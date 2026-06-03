package com.rork.shikshasetu

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.rork.shikshasetu.di.appModule
import com.rork.shikshasetu.services.AppService
import com.rork.shikshasetu.services.AuthService
import com.rork.shikshasetu.ui.navigation.AppNavigation
import com.rork.shikshasetu.ui.theme.AppTheme
import org.koin.android.ext.koin.androidContext
import org.koin.compose.KoinApplication
import org.koin.core.context.startKoin

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        startKoin {
            androidContext(this@MainActivity)
            modules(appModule)
        }

        // Initialize services
        val authService: AuthService = getKoin().get()
        val appService: AppService = getKoin().get()
        authService.initialize()
        appService.initialize()

        enableEdgeToEdge()
        setContent {
            AppTheme {
                AppNavigation()
            }
        }
    }

    private fun getKoin() = org.koin.core.context.GlobalContext.get()
}
