class Replies extends HTMLElement {
	async connectedCallback() {
		const response = await fetch(`https://replies.catskull.net?host=${location.host}${location.pathname}`)
		const data = await response.json()
		console.log(data)

		const container = document.createElement('div')
		container.id = 'page-replies'
		container.innerHTML = `
	<style>
		#page-replies {
			ul {
				list-style-type: none;
			}
		}
	</style>
	<a href="mailto:reply@catskull.net?subject=re:%20${location.href}">Reply</a>
  <ul>
      ${data.map(reply => `
          <li>
              <strong>${reply.name || reply.email}</strong>: ${reply.message}
              <br>Likes: ${reply.likes}
              <br><small>Posted on: ${new Date(reply.created_at).toLocaleString()}</small>
          </li>
      `).join('')}
  </ul>
`
		this.appendChild(container)
	}
}

customElements.define('page-replies', Replies)
