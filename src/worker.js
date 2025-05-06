import PostalMime from 'postal-mime'
import xss from 'xss'

export default {
	addCORSHeaders(response) {
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, HEAD, OPTIONS',
			'Access-Control-Max-Age': '86400',
			'Access-Control-Allow-Headers':
				'x-worker-key,Content-Type,x-custom-metadata,Content-MD5,x-amz-meta-fileid,x-amz-meta-account_id,x-amz-meta-clientid,x-amz-meta-file_id,x-amz-meta-opportunity_id,x-amz-meta-client_id,x-amz-meta-webhook',
			'Access-Control-Allow-Credentials': 'true',
			Allow: 'GET, POST, PUT, DELETE, HEAD, OPTIONS',
		}
		const newResponse = new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: corsHeaders,
		})
		return newResponse
	},

	async digestMessage(message) {
		// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#converting_a_digest_to_a_hex_string
		const msgUint8 = new TextEncoder().encode(message) // encode as (utf-8) Uint8Array
		const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8) // hash the message
		const hashArray = Array.from(new Uint8Array(hashBuffer)) // convert buffer to byte array
		const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('') // convert bytes to hex string
		return hashHex
	},

	async processReply(env, email) {
		const url = new URL(email?.subject?.match(/\bhttps?:\/\/\S+/gi)?.[0])

		if (!url) {
			return { error: 'Unable to find valid URL in email subject' }
		}

		const guid = crypto.randomUUID()
		const gravitar_hash = await this.digestMessage(email.from.address.trim().toLowerCase())

		const host = `${url.host}${url.pathname}` // catskull.net/path/to/document
		const subscribe = url.searchParams.get('subscribe') ?? 0
		const parent = url.hash.substring(1)

		const query = `
    INSERT INTO Replies (guid, url, message, email, created_at, updated_at, gravitar_hash, subscribe, parent, name)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'), ?, ?, ?,?)
    `

		const emailText = xss(email.text, {
			whiteList: {}, // empty, means filter out all tags
			stripIgnoreTag: true, // filter out all HTML not in the whitelist
			stripIgnoreTagBody: ['script'], // the script tag is a special case, we need
			// to filter out its content
		})

		await env.db
			.prepare(query)
			.bind(guid, host, emailText, null, gravitar_hash, subscribe, parent, email.from.name || email.from.address.split('@')[0])
			.run()

		const { results } = await env.db.prepare('SELECT * FROM Replies WHERE guid = ?').bind(guid).all()
		return results
	},

	async email(message, env, ctx) {
		const email = await PostalMime.parse(message.raw)

		const result = await this.processReply(env, email)
	},

	async fetch(request, env, ctx) {
		const url = new URL(request.url)
		const params = new URLSearchParams(url.search)
		const all = params.get('all') ?? false
		const host = all ? params.get('host').split('/')[0] : params.get('host')

		if (request.method === 'PUT') {
			const commentId = url.toString().split('/').pop()
			const result = await env.db
				.prepare(`
        UPDATE Replies
        SET likes = likes + 1
        WHERE guid = ?
        RETURNING likes;
      `)
				.bind(commentId)
				.first()

			if (!result) {
				return new Response('Reply not found', { status: 404 })
			}
			return this.addCORSHeaders(
				new Response(JSON.stringify(result), {
					headers: { 'Content-Type': 'application/json' },
				}),
			)
		}

		const statement = all
			? 'SELECT * FROM Replies WHERE url LIKE ? AND deleted_at IS NULL'
			: 'SELECT * FROM Replies WHERE url = ? AND deleted_at IS NULL'

		const { results } = await env.db
			.prepare(statement)
			.bind(`${host}${all ? '%' : ''}`)
			.all()

		function buildNestedReplies(replies, parentId = '') {
			return replies
				.filter((reply) => reply.parent === parentId)
				.map((reply) => {
					const { parent, url, subscribe, updated_at, deleted_at, name, email, ...rest } = reply
					return {
						...rest,
						children: buildNestedReplies(replies, reply.guid),
						created_at: `${reply.created_at}Z`,
						name: reply.name || reply.email,
						url: reply.url,
					}
				})
		}

		let nestedReplies = buildNestedReplies(results)

		if (all) {
			nestedReplies = Map.groupBy(nestedReplies, (r) => r.url)
			nestedReplies = Array.from(nestedReplies.entries())
				.map(([url, comments]) => {
					return {
						url: url,
						name: `/${url.split('/').slice(1).join('/')}`,
						message: `${comments.length} Replies on /${url.split('/')[1]}`,
						children: comments,
					}
				})
				.reverse()
		}

		return this.addCORSHeaders(
			new Response(
				JSON.stringify({
					replies: nestedReplies,
					total: results.length,
				}),
				{
					headers: { 'Content-Type': 'application/json' },
				},
			),
		)
	},
}
