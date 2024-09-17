class Replies extends HTMLElement {
	async connectedCallback() {
		const response = await fetch(`https://replies.catskull.net?host=${location.host}${location.pathname}`)
		const data = await response.json()

		const mailto = `reply@replies.catskull.net?subject=re:%20${location.href}`

		const incrementLikes = async (element, guid) => {
			let [number, string] = element.innerHTML.split(' ')
			const plusOne = Number.parseInt(number) + 1
			string += plusOne === 2 ? 's' : ''
			element.innerHTML = [plusOne, string].join(' ')

			const req = await fetch(`https://replies.catskull.net/like/${guid}`, { method: 'PUT' })
			const { likes } = await req.json()

			if (Number.parseInt(likes) !== plusOne) {
				element.innerHTML = [likes, string].join(' ')
			}
		}

		const renderReply = (reply) => {
			const li = document.createElement('li')
			li.innerHTML = `
		    <details open class="comment">
		      <summary>
		        <strong >${reply.name}</strong>
		      </summary>
		      <div class="comment-details">
		        <img class="profile-picture" src="https://gravatar.com/avatar/${reply.gravitar_hash}" alt="${reply.name}'s Profile Picture" width="50" height="50">
		        <div class="comment-content">
		          <p>${reply.message}</p>
		          <small>
			          <a title="Reply with an email!" href="mailto:${mailto}#${reply.guid}">Reply</a>
			          -
			          <span><a href="#" title="Click to like!">${reply.likes} Like${reply.likes === 1 ? '' : 's'}</a></span>
			          -
			          <span>${new Date(reply.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'numeric', year: 'numeric' })}</span>
		        	</small>
		        </div>
		      </div>
		    </details>
		  `

			const likeLink = li.querySelector('span a')
			likeLink.addEventListener('click', (event) => {
				event.preventDefault()
				incrementLikes(likeLink, reply.guid)
			})

			if (reply.children && reply.children.length > 0) {
				const detailsElement = li.querySelector('details')
				const ul = document.createElement('ul')
				reply.children.forEach((childReply) => ul.appendChild(renderReply(childReply)))
				detailsElement.appendChild(ul)
			}

			return li
		}

		const details = document.createElement('details')
		details.open = this.hasAttribute('open')

		const container = document.createElement('div')
		container.id = 'page-replies'

		const ul = document.createElement('ul')
		data.replies.forEach((reply) => ul.appendChild(renderReply(reply)))

		container.innerHTML = `
		  <style>
		    page-replies {
		      summary {
		        cursor: pointer;
		        strong {
		        	font-weight: bolder;
		        }
		      }
		      ul {
		        list-style-type: none;
		        padding: 0;
		        li {
		          border-left: 1px solid;
		          .comment {
		            display: flex;
		            align-items: center;
		            padding-left: 1ch;
		            .comment-details {
		              display: flex;
		              align-items: flex-start;
		              img {
		                margin: 0;
		                filter: saturate(0) contrast(200%);
		                transition: filter 0.5s ease;
		              }
		              .comment-content {
		                padding-left: 1ch;
		                p {
		                  margin: 0;
		                  padding-bottom: 5px;
		                }
		                span a {
		                  cursor: copy;
		                }
		              }
		            }
		          }
		          .comment > .comment-details:hover > img {
		            filter: none;
		          }
		        }
		      }
		    }
		  </style>
		`

		container.appendChild(ul)

		details.innerHTML = `
		  <summary>${data.total} Replies</summary>
		`
		details.appendChild(container)

		const replyLink = document.createElement('a')
		replyLink.href = `mailto:${mailto}`
		replyLink.textContent = 'Reply'

		this.appendChild(replyLink)
		this.appendChild(details)
	}
}

customElements.define('page-replies', Replies)
