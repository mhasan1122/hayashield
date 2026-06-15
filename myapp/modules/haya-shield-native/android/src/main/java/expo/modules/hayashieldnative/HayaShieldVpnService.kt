package expo.modules.hayashieldnative

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log
import androidx.core.app.NotificationCompat
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class HayaShieldVpnService : VpnService(), Runnable {
    private var vpnInterface: ParcelFileDescriptor? = null
    private var vpnThread: Thread? = null
    private var running = false
    private val executor: ExecutorService = Executors.newCachedThreadPool()

    companion object {
        const val TAG = "HayaShieldVpn"
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "haya_shield_vpn"
        var isRunning = false
        private var blockedDomains = setOf<String>()

        fun setBlockedDomains(domains: Set<String>) {
            blockedDomains = domains
        }

        fun isDomainBlocked(domain: String): Boolean {
            val cleanDomain = domain.lowercase().trim()
            if (blockedDomains.contains(cleanDomain)) return true
            for (blocked in blockedDomains) {
                if (cleanDomain.endsWith(".$blocked")) {
                    return true
                }
            }
            return false
        }
    }

    override fun onCreate() {
        super.onCreate()
        loadBlockedDomains()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == "START") {
            startVpn()
        } else if (intent?.action == "STOP") {
            stopVpn()
        }
        return START_STICKY
    }

    override fun onDestroy() {
        stopVpn()
        super.onDestroy()
    }

    private fun startVpn() {
        if (running) return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            createNotificationChannel()
            startForeground(NOTIFICATION_ID, buildNotification())
        }

        running = true
        isRunning = true
        vpnThread = Thread(this, "HayaShieldVpnThread").apply { start() }
        Log.d(TAG, "VPN Service started")
    }

    private fun stopVpn() {
        if (!running) return
        running = false
        isRunning = false
        vpnInterface?.close()
        vpnInterface = null
        vpnThread?.interrupt()
        vpnThread = null
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
        Log.d(TAG, "VPN Service stopped")
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Haya Shield VPN",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows when DNS filtering is active"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Haya Shield Active")
            .setContentText("DNS filtering is protecting your device")
            .setSmallIcon(R.drawable.ic_shield_notification)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }

    override fun run() {
        try {
            val builder = Builder()
            builder.setSession("HayaShieldDNS")
            builder.setMtu(1500)
            builder.addAddress("10.0.0.2", 32)
            builder.addRoute("10.0.0.1", 32)
            builder.addDnsServer("10.0.0.1")
            
            vpnInterface = builder.establish()
            if (vpnInterface == null) {
                Log.e(TAG, "Failed to establish VPN interface")
                return
            }

            val inputStream = FileInputStream(vpnInterface!!.fileDescriptor)
            val outputStream = FileOutputStream(vpnInterface!!.fileDescriptor)
            val buffer = ByteArray(32768)

            while (running) {
                val length = inputStream.read(buffer)
                if (length > 0) {
                    handlePacket(buffer, length, outputStream)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "VPN thread error", e)
        } finally {
            stopVpn()
        }
    }

    private fun handlePacket(buf: ByteArray, len: Int, outStream: FileOutputStream) {
        val version = (buf[0].toInt() shr 4) and 0x0F
        if (version != 4) return // only handle IPv4

        val ihl = (buf[0].toInt() and 0x0F) * 4
        val protocol = buf[9].toInt() and 0xFF
        if (protocol != 17) return // only handle UDP

        val srcPort = ((buf[ihl].toInt() and 0xFF) shl 8) or (buf[ihl + 1].toInt() and 0xFF)
        val destPort = ((buf[ihl + 2].toInt() and 0xFF) shl 8) or (buf[ihl + 3].toInt() and 0xFF)
        if (destPort != 53) return // only handle DNS queries

        val dnsOffset = ihl + 8
        val dnsLen = len - dnsOffset
        if (dnsLen < 12) return

        val dnsPayload = ByteArray(dnsLen)
        System.arraycopy(buf, dnsOffset, dnsPayload, 0, dnsLen)

        val clientIp = ByteArray(4)
        System.arraycopy(buf, 12, clientIp, 0, 4)

        parseAndProcessDns(dnsPayload, clientIp, srcPort, outStream)
    }

    private fun parseAndProcessDns(
        dnsPayload: ByteArray,
        clientIp: ByteArray,
        clientPort: Int,
        outStream: FileOutputStream
    ) {
        val qdCount = ((dnsPayload[4].toInt() and 0xFF) shl 8) or (dnsPayload[5].toInt() and 0xFF)
        if (qdCount <= 0) return

        val parsed = parseDomainName(dnsPayload, 12)
        val domain = parsed.first
        val qnameEnd = parsed.second

        if (domain.isEmpty()) return

        if (isDomainBlocked(domain)) {
            Log.d(TAG, "Blocking domain: $domain")
            val intent = Intent("expo.modules.hayashieldnative.BLOCKED_DOMAIN").apply {
                putExtra("domain", domain)
                putExtra("timestamp", System.currentTimeMillis())
            }
            sendBroadcast(intent)

            val dnsResponseLen = qnameEnd + 4
            if (dnsResponseLen <= dnsPayload.size) {
                val responseDnsPayload = ByteArray(dnsResponseLen)
                System.arraycopy(dnsPayload, 0, responseDnsPayload, 0, dnsResponseLen)

                responseDnsPayload[2] = (responseDnsPayload[2].toInt() or 0x80).toByte()
                responseDnsPayload[3] = ((responseDnsPayload[3].toInt() and 0xF0) or 0x80 or 0x03).toByte()

                responseDnsPayload[6] = 0x00.toByte()
                responseDnsPayload[7] = 0x00.toByte()
                responseDnsPayload[8] = 0x00.toByte()
                responseDnsPayload[9] = 0x00.toByte()
                responseDnsPayload[10] = 0x00.toByte()
                responseDnsPayload[11] = 0x00.toByte()

                writeVpnResponse(
                    outStream,
                    byteArrayOf(10, 0, 0, 1),
                    clientIp,
                    53,
                    clientPort,
                    responseDnsPayload
                )
            }
        } else {
            forwardDnsQuery(dnsPayload, clientIp, clientPort, outStream)
        }
    }

    private fun forwardDnsQuery(
        dnsQuery: ByteArray,
        clientIp: ByteArray,
        clientPort: Int,
        outStream: FileOutputStream
    ) {
        executor.submit {
            var socket: DatagramSocket? = null
            try {
                socket = DatagramSocket()
                protect(socket)
                socket.soTimeout = 4000

                val serverAddress = InetAddress.getByName("1.1.1.1")
                val sendPacket = DatagramPacket(dnsQuery, dnsQuery.size, serverAddress, 53)
                socket.send(sendPacket)

                val recvBuf = ByteArray(4096)
                val recvPacket = DatagramPacket(recvBuf, recvBuf.size)
                socket.receive(recvPacket)

                val dnsResponse = ByteArray(recvPacket.length)
                System.arraycopy(recvBuf, 0, dnsResponse, 0, recvPacket.length)

                writeVpnResponse(
                    outStream,
                    byteArrayOf(10, 0, 0, 1),
                    clientIp,
                    53,
                    clientPort,
                    dnsResponse
                )
            } catch (e: Exception) {
                // Ignore resolve timeouts
            } finally {
                socket?.close()
            }
        }
    }

    private fun writeVpnResponse(
        outStream: FileOutputStream,
        srcIp: ByteArray,
        destIp: ByteArray,
        srcPort: Int,
        destPort: Int,
        dnsPayload: ByteArray
    ) {
        try {
            val ipHeaderLen = 20
            val udpHeaderLen = 8
            val totalLen = ipHeaderLen + udpHeaderLen + dnsPayload.size
            val response = ByteArray(totalLen)

            // IP Header
            response[0] = 0x45.toByte()
            response[1] = 0x00.toByte()
            response[2] = ((totalLen shr 8) and 0xFF).toByte()
            response[3] = (totalLen and 0xFF).toByte()
            response[4] = 0x00.toByte()
            response[5] = 0x00.toByte()
            response[6] = 0x40.toByte()
            response[7] = 0x00.toByte()
            response[8] = 64.toByte()
            response[9] = 17.toByte()

            System.arraycopy(srcIp, 0, response, 12, 4)
            System.arraycopy(destIp, 0, response, 16, 4)

            response[10] = 0x00.toByte()
            response[11] = 0x00.toByte()
            val ipChecksum = calculateChecksum(response, ipHeaderLen)
            response[10] = ((ipChecksum shr 8) and 0xFF).toByte()
            response[11] = (ipChecksum and 0xFF).toByte()

            // UDP Header
            response[20] = ((srcPort shr 8) and 0xFF).toByte()
            response[21] = (srcPort and 0xFF).toByte()
            response[22] = ((destPort shr 8) and 0xFF).toByte()
            response[23] = (destPort and 0xFF).toByte()

            val udpLen = udpHeaderLen + dnsPayload.size
            response[24] = ((udpLen shr 8) and 0xFF).toByte()
            response[25] = (udpLen and 0xFF).toByte()
            response[26] = 0x00.toByte()
            response[27] = 0x00.toByte()

            System.arraycopy(dnsPayload, 0, response, 28, dnsPayload.size)

            synchronized(outStream) {
                outStream.write(response)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to write response to VPN", e)
        }
    }

    private fun calculateChecksum(buf: ByteArray, length: Int): Int {
        var sum = 0
        var i = 0
        while (i < length) {
            val word = ((buf[i].toInt() and 0xFF) shl 8) or (buf[i + 1].toInt() and 0xFF)
            sum += word
            i += 2
        }
        while (sum shr 16 != 0) {
            sum = (sum and 0xFFFF) + (sum shr 16)
        }
        return (sum.inv()) and 0xFFFF
    }

    private fun parseDomainName(dnsPayload: ByteArray, offset: Int): Pair<String, Int> {
        val domain = StringBuilder()
        var curr = offset
        while (curr < dnsPayload.size) {
            val len = dnsPayload[curr].toInt() and 0xFF
            if (len == 0) {
                curr++
                break
            }
            if ((len and 0xC0) == 0xC0) {
                curr += 2
                break
            }
            if (domain.isNotEmpty()) {
                domain.append(".")
            }
            if (curr + 1 + len <= dnsPayload.size) {
                domain.append(String(dnsPayload, curr + 1, len, Charsets.US_ASCII))
            }
            curr += 1 + len
        }
        return Pair(domain.toString(), curr)
    }

    private fun loadBlockedDomains() {
        val file = File(filesDir, "blocked_domains.json")
        if (file.exists()) {
            try {
                val json = file.readText()
                val cleaned = json.replace("[", "").replace("]", "").replace("\"", "").trim()
                if (cleaned.isNotEmpty()) {
                    blockedDomains = cleaned.split(",").map { it.trim().lowercase() }.toSet()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to parse blocked domains file", e)
            }
        }
    }
}
