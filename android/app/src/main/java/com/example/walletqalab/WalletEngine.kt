package com.example.walletqalab

import java.math.BigDecimal
import java.math.RoundingMode

/** Educational in-memory payment engine: synthetic charges only, no bank/issuer/SDK access. */
data class DemoPayment(
    val id: String,
    val requestId: String,
    val amountCents: Int,
    val cashbackCents: Int,
    val refunded: Boolean = false
)

data class PaymentDecision(
    val code: String,
    val payment: DemoPayment? = null,
    val duplicate: Boolean = false
)

class WalletEngine {
    private val ledger = mutableListOf<DemoPayment>()

    fun payments(): List<DemoPayment> = ledger.toList()

    fun netCashbackCents(): Int = ledger.filterNot { it.refunded }.sumOf { it.cashbackCents }

    fun charge(
        requestId: String,
        amountText: String,
        online: Boolean,
        authenticated: Boolean,
        cardActive: Boolean,
        grocery: Boolean = false,
        injectDuplicateBug: Boolean = false
    ): PaymentDecision {
        val cents = parseAmountCents(amountText) ?: return PaymentDecision("INVALID_AMOUNT")
        if (!online) return PaymentDecision("OFFLINE")
        if (!authenticated) return PaymentDecision("AUTH_EXPIRED")
        if (!cardActive) return PaymentDecision("CARD_LOCKED")

        val previous = ledger.firstOrNull { it.requestId == requestId }
        if (previous != null && !injectDuplicateBug) {
            return if (previous.amountCents == cents) {
                PaymentDecision("APPROVED", previous, duplicate = true)
            } else {
                PaymentDecision("REQUEST_CONFLICT")
            }
        }
        val bonus = if (grocery) 5 else 2
        val cashback = (BigDecimal(cents).multiply(BigDecimal(bonus))
            .divide(BigDecimal(100), 0, RoundingMode.HALF_UP)).intValueExact()
        val payment = DemoPayment(
            id = "demo-${(ledger.size + 1).toString().padStart(4, '0')}",
            requestId = requestId,
            amountCents = cents,
            cashbackCents = cashback
        )
        ledger.add(payment)
        return PaymentDecision("APPROVED", payment)
    }

    fun refundLatest(): String {
        val idx = ledger.indexOfLast { !it.refunded }
        if (idx == -1) return "NOTHING_TO_REFUND"
        ledger[idx] = ledger[idx].copy(refunded = true)
        return "REFUNDED"
    }

    private fun parseAmountCents(text: String): Int? {
        if (!Regex("""^[0-9]+(?:\.[0-9]{1,2})?$""").matches(text.trim())) return null
        return try {
            val amount = BigDecimal(text.trim())
            if (amount.signum() <= 0 || amount > BigDecimal("100000.00")) null
            else amount.movePointRight(2).intValueExact()
        } catch (_: Exception) { null }
    }
}
