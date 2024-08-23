class Replies extends HTMLElement {
	async connectedCallback() {
		const response = await fetch(`https://replies.catskull.net?host=${location.host}${location.pathname}`)
		const data = await response.json()
		console.log(data)

		const container = document.createElement('div')
		container.innerHTML = `
	<a href="mailto:reply@catskull.net?subject=re:%20${location.href}">Reply</a>
  <ul>
      ${data.map(reply => `
          <li>
              <strong>${reply.name}</strong>: ${reply.message}
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
