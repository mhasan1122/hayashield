package expo.modules.hayashieldnative

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.VpnService
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class HayaShieldNativeModule : Module() {

  private val receiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      if (intent?.action == "expo.modules.hayashieldnative.BLOCKED_DOMAIN") {
        val domain = intent.getStringExtra("domain") ?: ""
        val timestamp = intent.getLongExtra("timestamp", System.currentTimeMillis())
        sendEvent("onBlockedDomain", mapOf(
          "domain" to domain,
          "timestamp" to timestamp.toDouble()
        ))
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("HayaShieldNative")

    Events("onBlockedDomain")

    OnCreate {
      val filter = IntentFilter("expo.modules.hayashieldnative.BLOCKED_DOMAIN")
      val context = appContext.reactContext
      if (context != null) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
          context.registerReceiver(receiver, filter)
        }
      }
    }

    OnDestroy {
      try {
        appContext.reactContext?.unregisterReceiver(receiver)
      } catch (e: Exception) {}
    }

    // VPN Methods
    Function("checkVpnPermission") {
      val context = appContext.reactContext ?: return@Function false
      VpnService.prepare(context) == null
    }

    Function("requestVpnPermission") {
      val context = appContext.reactContext
      if (context != null) {
        val intent = VpnService.prepare(context)
        if (intent != null) {
          intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          val activity = appContext.currentActivity
          if (activity != null) {
            activity.startActivity(intent)
          } else {
            context.startActivity(intent)
          }
        }
      }
    }

    Function("startVpn") {
      val context = appContext.reactContext
      if (context != null) {
        val intent = Intent(context, HayaShieldVpnService::class.java).apply {
          action = "START"
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          context.startForegroundService(intent)
        } else {
          context.startService(intent)
        }
      }
    }

    Function("stopVpn") {
      val context = appContext.reactContext
      if (context != null) {
        val intent = Intent(context, HayaShieldVpnService::class.java).apply {
          action = "STOP"
        }
        context.startService(intent)
      }
    }

    Function("isVpnEnabled") {
      HayaShieldVpnService.isRunning
    }

    // Accessibility App Blocker Methods
    Function("isAccessibilityEnabled") {
      val context = appContext.reactContext ?: return@Function false
      val expectedComponentName = ComponentName(context, HayaShieldAccessibilityService::class.java)
      val enabledServices = Settings.Secure.getString(
        context.contentResolver,
        Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
      ) ?: return@Function false
      enabledServices.contains(expectedComponentName.flattenToString())
    }

    Function("openAccessibilitySettings") {
      val context = appContext.reactContext
      if (context != null) {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
          flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
      }
    }

    // Blocklist configuration
    Function("setBlockedDomains") { domains: List<String> ->
      val context = appContext.reactContext
      if (context != null) {
        val file = File(context.filesDir, "blocked_domains.json")
        try {
          val json = domains.joinToString(prefix = "[", postfix = "]", separator = ",") { "\"$it\"" }
          file.writeText(json)
          HayaShieldVpnService.setBlockedDomains(domains.toSet())
        } catch (e: Exception) {}
      }
    }

    Function("setBlockedApps") { apps: List<String> ->
      val context = appContext.reactContext
      if (context != null) {
        val file = File(context.filesDir, "blocked_apps.json")
        try {
          val json = apps.joinToString(prefix = "[", postfix = "]", separator = ",") { "\"$it\"" }
          file.writeText(json)
          HayaShieldAccessibilityService.setBlockedApps(apps.toSet())
        } catch (e: Exception) {}
      }
    }

    Function("setFocusMode") { enabled: Boolean, endTime: Double, apps: List<String> ->
      HayaShieldAccessibilityService.setFocusMode(enabled, endTime.toLong(), apps.toSet())
    }

    Function("getPendingBlockedApp") {
      val app = HayaShieldAccessibilityService.pendingBlockedApp
      HayaShieldAccessibilityService.pendingBlockedApp = null
      app
    }

    // Get list of user apps
    Function("getInstalledApps") {
      val context = appContext.reactContext ?: return@Function emptyList<Map<String, String>>()
      val pm = context.packageManager
      val apps = pm.getInstalledPackages(0)
      val appList = mutableListOf<Map<String, String>>()
      
      for (pkg in apps) {
        val launchIntent = pm.getLaunchIntentForPackage(pkg.packageName) ?: continue
        val appInfo = pkg.applicationInfo ?: continue
        val name = pm.getApplicationLabel(appInfo).toString()
        appList.add(mapOf(
          "packageName" to pkg.packageName,
          "name" to name
        ))
      }
      appList.sortedBy { it["name"] }
    }
  }
}
