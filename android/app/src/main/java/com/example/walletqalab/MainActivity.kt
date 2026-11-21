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
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.unit.dp

/** Independent native Android QA target: does NOT open Samsung Wallet or process money. */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { MaterialTheme { WalletScreen() } }
    }
}

@Composable
fun WalletScreen() {
    val engine = remember { WalletEngine() }
    var amount by remember { mutableStateOf("10.01") }
    var online by remember { mutableStateOf(true) }
    var authenticated by remember { mutableStateOf(true) }
    var cardActive by remember { mutableStateOf(true) }
    var grocery by remember { mutableStateOf(false) }
    var injectDuplicateBug by remember { mutableStateOf(false) }
    var result by remember { mutableStateOf("READY") }
    var nextId by remember { mutableIntStateOf(1) }
    var lastRequestId by remember { mutableStateOf<String?>(null) }

    fun log(action: String, id: String?) {
        // Correlation IDs are synthetic; no PAN, OTP, identity or token is logged.
        Log.i("WalletQaLab", "event=$action code=$result requestId=${id ?: "none"} total=${engine.payments().size}")
    }
    fun execute(requestId: String) {
        val decision = engine.charge(requestId, amount, online, authenticated, cardActive, grocery, injectDuplicateBug)
        result = if (decision.duplicate) "APPROVED_DUPLICATE_IGNORED" else decision.code
        log("PAYMENT", requestId)
    }

    Column(
        modifier = Modifier.fillMaxSize()
            .semantics { testTagsAsResourceId = true }
            .verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Wallet QA Lab · Android", style = MaterialTheme.typography.headlineSmall)
        Text("Independent educational simulator · No real cards, payments, NFC or Samsung SDK")
        Text("Result: $result", modifier = Modifier.testTag("result_text"), style = MaterialTheme.typography.titleMedium)
        Text("Transactions: ${engine.payments().size}", modifier = Modifier.testTag("history_count"))
        Text("Net cash back: ${engine.netCashbackCents()}¢", modifier = Modifier.testTag("cashback_text"))
        Text("Last request: ${lastRequestId ?: "none"}", modifier = Modifier.testTag("request_text"))
        OutlinedTextField(
            value = amount, onValueChange = { amount = it },
            label = { Text("Amount (USD)") }, singleLine = true,
            modifier = Modifier.fillMaxWidth().testTag("amount_field")
        )
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Network available")
            Switch(checked = online, onCheckedChange = { online = it }, modifier = Modifier.testTag("network_switch"))
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Authentication valid")
            Switch(checked = authenticated, onCheckedChange = { authenticated = it }, modifier = Modifier.testTag("auth_switch"))
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Demo card active")
            Switch(checked = cardActive, onCheckedChange = { cardActive = it }, modifier = Modifier.testTag("card_switch"))
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Grocery reward (5%)")
            Switch(checked = grocery, onCheckedChange = { grocery = it }, modifier = Modifier.testTag("grocery_switch"))
        }
        Button(onClick = {
            val requestId = "req-${nextId.toString().padStart(4, '0')}"
            nextId += 1
            lastRequestId = requestId
            execute(requestId)
        }, modifier = Modifier.fillMaxWidth().testTag("pay_button")) {
            Text("Process mock payment")
        }
        Button(onClick = {
            val requestId = lastRequestId
            if (requestId == null) {
                result = "NO_REQUEST"
            } else {
                execute(requestId)
            }
        }, modifier = Modifier.fillMaxWidth().testTag("duplicate_button")) {
            Text("Retry last request (idempotency test)")
        }
        OutlinedButton(onClick = {
            result = engine.refundLatest()
                log("REFUND", lastRequestId)
        }, modifier = Modifier.fillMaxWidth().testTag("refund_button")) {
            Text("Refund latest synthetic payment")
        }
        HorizontalDivider()
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Inject duplicate-charge defect")
            Switch(checked = injectDuplicateBug, onCheckedChange = { injectDuplicateBug = it }, modifier = Modifier.testTag("fault_switch"))
        }
        Text("QA exercises: offline, expired authentication, locked card, $0 / 1.999, duplicate requests, 2% vs 5% rewards, refunds, and defect reproduction.")
        Text("Logcat tag: WalletQaLab. UI test IDs: pay_button, result_text, network_switch, duplicate_button and others.")
    }
}
