const path = require(`path`);
module.exports = async ({ actions, graphql }) => {
	const GET_PAGES = `
  query GET_PAGES($first:Int $after:String){
    wordpress {
      pages(
        first: $first 
        after: $after
        where: {
          parent: null
        }
      ) {
        pageInfo {
          endCursor
          hasNextPage
        }
        nodes {
          id
          uri
          pageId
          title
		  isFrontPage
          seo {
            title
            metaDesc
            focuskw
          }
        }
      }
    }
  }
  `;
	const { createPage } = actions;
	const allPages = [];
	const fetchPages = async (variables) =>
		await graphql(GET_PAGES, variables).then(({ data }) => {
			const {
				wordpress: {
					pages: {
						nodes,
						pageInfo: { hasNextPage, endCursor },
					},
				},
			} = data;
			nodes.map((page) => {
				allPages.push(page);
			});
			if (hasNextPage) {
				return fetchPages({ first: variables.first, after: endCursor });
			}
			return allPages;
		});

	await fetchPages({ first: 100, after: null }).then((allPages) => {
		const pageTemplate = path.resolve(`./src/components/templates/page.js`);

		allPages.map((page) => {
			if (
				page.uri !== "/blog/" &&
				page.uri !== "/case-study/" &&
				page.uri !== "/work/"
			) {
				console.log(`create page: ${page.uri}`);
				createPage({
					path: page.uri === "/" ? "/" : `${page.uri}`,
					component: pageTemplate,
					context: page,
				});
			}
		});
	});
};



