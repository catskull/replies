export default {
    async digestMessage(message) {
      // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#converting_a_digest_to_a_hex_string
      const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // hash the message
      const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""); // convert bytes to hex string
      return hashHex;
    },

  async processReply(env, message) {
    const guid = crypto.randomUUID()
    const email = message.from.trim().toLowerCase();
    const gravitar_hash = await this.digestMessage(email);

    const url = new URL(message.subject.split(' ')[1]);
    const host = `${url.origin}${url.pathname}`;
    const subscribe = url.searchParams.get('subscribe') ?? 0;
    const parent = url.hash.substring(1);

    console.log(`Host: ${host}`);
    console.log(`subscribe: ${subscribe}`);
    console.log(`Anchor: ${anchor}`);

    const query = `
      INSERT INTO Replies (guid, url, message, email, created_at, updated_at, gravitar_hash, subscribe, parent)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'), ?, ?, ?)
    `;

    await env.db.prepare(query).bind(guid, host, message.message, email, gravitar_hash, subscribe, parent).run();

    const { results } = await env.db.prepare("SELECT * FROM Replies WHERE guid = ?").bind(guid).all();
    return results;
  },

  async email(message, env, ctx) {
    debugger;
    await this.processReply(env, message);
  },

  async fetch(request, env) {
    const message = {
      from: 'dave@prizem.group',
      to: 'reply@catskull.net',
      subject: 're: https://test.com/test',
      message: 'I thought this was a very well-written article.',
    };

    const results = await this.processReply(env, message);
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
