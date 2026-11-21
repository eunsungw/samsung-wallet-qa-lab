package com.example.walletqalab

import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/** Instrumented UI tests that run inside the Android emulator / physical test phone. */
@RunWith(AndroidJUnit4::class)
class WalletScreenTest {
    @get:Rule val composeRule = createAndroidComposeRule<MainActivity>()

    @Test fun nativeApprovedPayment() {
        composeRule.onNodeWithTag("pay_button").performClick()
        composeRule.onNodeWithTag("result_text").assertTextContains("APPROVED")
        composeRule.onNodeWithTag("history_count").assertTextContains("1")
    }

    @Test fun nativeOfflineDecline() {
        composeRule.onNodeWithTag("network_switch").performClick()
        composeRule.onNodeWithTag("pay_button").performClick()
        composeRule.onNodeWithTag("result_text").assertTextContains("OFFLINE")
        composeRule.onNodeWithTag("history_count").assertTextContains("0")
    }

    @Test fun nativeExpiredAuthenticationDecline() {
        composeRule.onNodeWithTag("auth_switch").performClick()
        composeRule.onNodeWithTag("pay_button").performClick()
        composeRule.onNodeWithTag("result_text").assertTextContains("AUTH_EXPIRED")
        composeRule.onNodeWithTag("history_count").assertTextContains("0")
    }

    @Test fun nativeDuplicateRequestDoesNotDoubleCharge() {
        composeRule.onNodeWithTag("pay_button").performClick()
        composeRule.onNodeWithTag("duplicate_button").performScrollTo().performClick()
        composeRule.onNodeWithTag("result_text").assertTextContains("APPROVED_DUPLICATE_IGNORED")
        composeRule.onNodeWithTag("history_count").assertTextContains("1")
    }

    @Test fun nativeInjectedDefectCanBeReproduced() {
        composeRule.onNodeWithTag("fault_switch").performScrollTo().performClick()
        composeRule.onNodeWithTag("pay_button").performClick()
        composeRule.onNodeWithTag("duplicate_button").performScrollTo().performClick()
        composeRule.onNodeWithTag("history_count").assertTextContains("2")
    }

    @Test fun nativeRefundReversesCashback() {
        composeRule.onNodeWithTag("pay_button").performClick()
        composeRule.onNodeWithTag("refund_button").performScrollTo().performClick()
        composeRule.onNodeWithTag("result_text").assertTextContains("REFUNDED")
        composeRule.onNodeWithTag("cashback_text").assertTextContains("0¢")
    }
}
