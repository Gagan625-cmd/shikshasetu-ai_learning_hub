package com.rork.shikshasetu.di

import com.rork.shikshasetu.services.AppService
import com.rork.shikshasetu.services.AuthService
import com.rork.shikshasetu.services.StorageService
import com.rork.shikshasetu.services.SupabaseService
import org.koin.android.ext.koin.androidContext
import org.koin.dsl.module

val appModule = module {
    single { StorageService(androidContext()) }
    single { AuthService(get()) }
    single { AppService(get(), get()) }
    single { SupabaseService() }
}
