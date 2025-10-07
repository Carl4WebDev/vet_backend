export default class SubscriptionRepo {
  constructor(pool) {
    this.pool = pool;
  }

  async createFreeTrial(userId) {
    // 🟣 Free Trial plan_id (inserted above)
    const freeTrialPlanId = 3;

    const result = await this.pool.query(
      `
      INSERT INTO user_subscriptions (user_id, plan_id, start_date, end_date, status, auto_renew)
      VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months', 'active', false)
      RETURNING *;
      `,
      [userId, freeTrialPlanId]
    );

    return result.rows[0];
  }
}
