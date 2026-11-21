package com.example.walletqalab

import org.junit.Assert.*
import org.junit.Test

/** JVM tests for the native wallet's business rules; do not need an Android emulator. */
class WalletEngineTest {
    private fun wallet() = WalletEngine()

    @Test fun approvedPaymentAndReward() {
        val engine = wallet()
        assertEquals("APPROVED", engine.charge("req-a", "10.01", true, true, true).code)
        assertEquals(1, engine.payments().size)
        assertEquals(20, engine.netCashbackCents())
    }

    @Test fun retryIsIdempotentAndRequestIdsCannotBeReusedForNewAmounts() {
        val engine = wallet()
        engine.charge("req-a", "10.01", true, true, true)
        val duplicate = engine.charge("req-a", "10.01", true, true, true)
        assertTrue(duplicate.duplicate)
        assertEquals(1, engine.payments().size)
        assertEquals("REQUEST_CONFLICT", engine.charge("req-a", "11.00", true, true, true).code)
    }

    @Test fun offlineAndExpiredAuthenticationNeverCharge() {
        val engine = wallet()
        assertEquals("OFFLINE", engine.charge("req-a", "10.01", false, true, true).code)
        assertEquals("AUTH_EXPIRED", engine.charge("req-b", "10.01", true, false, true).code)
        assertTrue(engine.payments().isEmpty())
    }

    @Test fun lockedCardDeclines() {
        assertEquals("CARD_LOCKED", wallet().charge("req-a", "10.01", true, true, false).code)
    }

    @Test fun amountValidationBlocksInvalidInput() {
        listOf("0", "-1.00", "1.999", "", "Infinity", "100000.01", "1e4")
            .forEach { amount ->
                assertEquals("INVALID_AMOUNT", wallet().charge("req-a", amount, true, true, true).code)
            }
    }

    @Test fun groceryCashbackAndRefundReverseReward() {
        val engine = wallet()
        val result = engine.charge("req-a", "19.99", true, true, true, grocery = true)
        assertEquals(100, result.payment?.cashbackCents)
        assertEquals("REFUNDED", engine.refundLatest())
        assertEquals(0, engine.netCashbackCents())
        assertEquals("NOTHING_TO_REFUND", engine.refundLatest())
    }

    @Test fun injectedDuplicateFaultShowsDefectButNormalModeDoesNot() {
        val engine = wallet()
        engine.charge("req-a", "10.01", true, true, true, injectDuplicateBug = true)
        engine.charge("req-a", "10.01", true, true, true, injectDuplicateBug = true)
        assertEquals(2, engine.payments().size)
    }
}
