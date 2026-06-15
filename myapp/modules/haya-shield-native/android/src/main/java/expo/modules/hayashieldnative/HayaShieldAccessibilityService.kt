package expo.modules.hayashieldnative

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import java.io.File

class HayaShieldAccessibilityService : AccessibilityService() {

    companion object {
        const val TAG = "HayaShieldAccess"
        var isRunning = false
        var pendingBlockedApp: String? = null
        
        private var blockedApps = setOf<String>()
        private var isFocusModeActive = false
        private var focusModeEndTime = 0L
        private var focusBlockedApps = setOf<String>()

        fun setBlockedApps(apps: Set<String>) {
            blockedApps = apps
        }

        fun setFocusMode(enabled: Boolean, endTime: Long, apps: Set<String>) {
            isFocusModeActive = enabled
            focusModeEndTime = endTime
            focusBlockedApps = apps
        }

        fun shouldBlockApp(packageName: String): Boolean {
            if (blockedApps.contains(packageName)) return true
            if (isFocusModeActive && System.currentTimeMillis() < focusModeEndTime) {
                if (focusBlockedApps.contains(packageName)) return true
            }
            return false
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        isRunning = true
        Log.d(TAG, "Accessibility Service Connected")
        loadBlockedApps()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val packageName = event.packageName?.toString() ?: return
            
            // Skip our own application
            if (packageName == this.packageName) return

            // Check if focus mode should expire
            if (isFocusModeActive && System.currentTimeMillis() >= focusModeEndTime) {
                isFocusModeActive = false
            }

            if (shouldBlockApp(packageName)) {
                Log.d(TAG, "Blocking application: $packageName")
                
                // Kick user to launcher home screen
                performGlobalAction(GLOBAL_ACTION_HOME)

                // Set pending blocked app
                pendingBlockedApp = packageName

                // Launch Haya Shield main application
                val intent = packageManager.getLaunchIntentForPackage(this.packageName)
                if (intent != null) {
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    intent.putExtra("blockedApp", packageName)
                    intent.putExtra("triggerBlockScreen", true)
                    startActivity(intent)
                }
            }
        }
    }

    override fun onInterrupt() {
        Log.d(TAG, "Accessibility Service Interrupted")
        isRunning = false
    }

    override fun onDestroy() {
        Log.d(TAG, "Accessibility Service Destroyed")
        isRunning = false
        super.onDestroy()
    }

    private fun loadBlockedApps() {
        val file = File(filesDir, "blocked_apps.json")
        if (file.exists()) {
            try {
                val json = file.readText()
                val cleaned = json.replace("[", "").replace("]", "").replace("\"", "").trim()
                if (cleaned.isNotEmpty()) {
                    blockedApps = cleaned.split(",").map { it.trim() }.toSet()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to load blocked apps", e)
            }
        }
    }
}
