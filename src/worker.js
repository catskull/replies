export default {
  async email(message, env, ctx) {
    const { results } = await env.db.prepare(
      "SELECT * FROM Replies"
    )
      .all();
    console.log(results);
  },

  async scheduled(event, env, ctx) {
    const { results } = await env.db.prepare(
      "SELECT * FROM Replies"
    )
      .all();
    console.log(results);
  }
}