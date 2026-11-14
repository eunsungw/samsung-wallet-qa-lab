package com.example.walletqalab

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import java.util.UUID

/** Standalone Android QA target. It never invokes Samsung Wallet or any real payment gateway. */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { MaterialTheme { WalletScreen() } }
    }
}

/** Pure, testable demonstration payment decision logic. */
object FakePaymentEngine {
    fun authorize(amountText: String, online: Boolean, authenticated: Boolean): String {
        val value = amountText.toBigDecimalOrNull()
        if (value == null || value.signum() <= 0 || value.scale() > 2 || value > "100000.00".toBigDecimal()) return "INVALID_AMOUNT"
        if (!online) return "OFFLINE"
        if (!authenticated) return "AUTH_EXPIRED"
        return "APPROVED"
    }
}

@Composable
fun WalletScreen() {
    var amount by remember { mutableStateOf("10.01") }
    var online by remember { mutableStateOf(true) }
    var authenticated by remember { mutableStateOf(true) }
    var result by remember { mutableStateOf("Ready to test") }
    val scroll = rememberScrollState()
    Column(modifier = Modifier.fillMaxSize().verticalScroll(scroll).padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Wallet QA Lab", style = MaterialTheme.typography.headlineMedium)
        Text("Independent native Android payment simulator — no real money or credentials")
        OutlinedTextField(value = amount, onValueChange = { amount = it }, label = { Text("Amount (USD)") }, modifier = Modifier.fillMaxWidth().testTag("amount_field"))
        Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
            Text("Network available")
            Switch(checked = online, onCheckedChange = { online = it }, modifier = Modifier.testTag("network_switch"))
        }
        Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
            Text("Authentication valid")
            Switch(checked = authenticated, onCheckedChange = { authenticated = it }, modifier = Modifier.testTag("auth_switch"))
        }
        Button(onClick = {
            val trace = "native-${UUID.randomUUID().toString().take(8)}"
            result = FakePaymentEngine.authorize(amount, online, authenticated)
            Log.i("WalletQaLab", "event=PAYMENT_TEST_RESULT code=$result trace=$trace")
        }, modifier = Modifier.fillMaxWidth().testTag("pay_button")) { Text("Process mock payment") }
        Text("Result: $result", modifier = Modifier.testTag("result_text"))
        HorizontalDivider()
        Text("QA challenges: disable network, expire the session, test 0 / -2 / 1.999, and inspect adb logcat -s WalletQaLab:I *:S")
    }
}
