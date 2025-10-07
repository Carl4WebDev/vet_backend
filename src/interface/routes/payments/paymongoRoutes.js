import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.post("/create-payment-intent", async (req, res) => {
  const { amount, userId, planId } = req.body;

  try {
    // ✅ 1️⃣ Convert amount to centavos
    const centavos = amount * 100;

    // ✅ 2️⃣ Basic Auth header (PayMongo)
    const authHeader = `Basic ${Buffer.from(
      process.env.PAYMONGO_SECRET_KEY + ":"
    ).toString("base64")}`;

    // ✅ 3️⃣ Create Payment Intent
    const paymentIntentRes = await fetch(
      "https://api.paymongo.com/v1/payment_intents",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          data: {
            attributes: {
              amount: centavos,
              currency: "PHP",
              description: `Subscription Plan ${planId}`,
              payment_method_allowed: ["card", "gcash"],
              payment_method_options: {
                card: {
                  request_three_d_secure: "automatic",
                },
              },
            },
          },
        }),
      }
    );

    const paymentIntentData = await paymentIntentRes.json();
    if (!paymentIntentRes.ok) {
      console.error("PayMongo error:", paymentIntentData);
      return res.status(400).json({ error: "Failed to create payment intent" });
    }

    const paymentIntentId = paymentIntentData.data.id;

    // ✅ 4️⃣ Create Checkout Session
    const checkoutRes = await fetch(
      "https://api.paymongo.com/v1/checkout_sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          data: {
            attributes: {
              send_email_receipt: true,
              show_line_items: true,
              cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
              success_url: `${process.env.FRONTEND_URL}/subscription/success`,
              payment_method_types: ["card", "gcash"], // ✅ FIXED
              line_items: [
                {
                  currency: "PHP",
                  amount: centavos,
                  name: `Subscription Plan ${planId}`,
                  quantity: 1,
                },
              ],
              payment_intent: paymentIntentId,
            },
          },
        }),
      }
    );

    const checkoutData = await checkoutRes.json();
    if (!checkoutRes.ok) {
      console.error("PayMongo error:", checkoutData);
      return res
        .status(400)
        .json({ error: "Failed to create checkout session" });
    }

    // ✅ 5️⃣ Send checkout URL to frontend
    const checkoutUrl = checkoutData.data.attributes.checkout_url;
    res.json({ checkoutUrl });
  } catch (err) {
    console.error("Payment error:", err);
    res.status(500).json({ error: "Payment failed" });
  }
});

export default router;
