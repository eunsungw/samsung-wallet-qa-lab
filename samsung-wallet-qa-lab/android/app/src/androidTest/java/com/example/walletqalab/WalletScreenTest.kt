package com.example.walletqalab

import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class WalletScreenTest {
    @get:Rule val composeRule = createAndroidComposeRule<MainActivity>()

    @Test fun approvedPaymentShowsExpectedResult() {
        composeRule.onNodeWithTag("pay_button").performClick()
        composeRule.onNodeWithTag("result_text").assertTextContains("APPROVED")
    }

    @Test fun offlinePaymentDoesNotApprove() {
        composeRule.onNodeWithTag("network_switch").performClick()
        composeRule.onNodeWithTag("pay_button").performClick()
        composeRule.onNodeWithTag("result_text").assertTextContains("OFFLINE")
    }
}
