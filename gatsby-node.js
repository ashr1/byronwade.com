exports.onCreatePage = async ({ page, actions }) => {
	const { createPage } = actions

	// Only update the `/app` page.
	if (page.path.match(/^\/app/)) {
		// page.matchPath is a special key that's used for matching pages
		// with corresponding routes only on the client.
		page.matchPath = "/app/*"

		// Update the page.
		createPage(page)
	}

	// Only update the `/app` page.
	if (page.path.match(/^\/admin/)) {
		// page.matchPath is a special key that's used for matching pages
		// with corresponding routes only on the client.
		page.matchPath = "/admin/*"

		// Update the page.
		createPage(page)
	}
}




/* --------- Programatically Create Image Nodes --------- */
const { createRemoteFileNode } = require("gatsby-source-filesystem");

/* --------- Programatically Create Pages --------- */
const createPages = require("./src/create/createPages");
const createCases = require("./src/create/createCases");
const createWorks = require("./src/create/createWorks");
const createUsers = require("./src/create/createUsers");
const createTags = require("./src/create/createTags");
const createCategories = require("./src/create/createCategories");
const createPosts = require("./src/create/createPosts");

exports.createPages = async ({ actions, graphql }) => {
	await createPages({ actions, graphql });
	await createCases({ actions, graphql });
	await createWorks({ actions, graphql });
	await createUsers({ actions, graphql });
	await createTags({ actions, graphql });
	await createCategories({ actions, graphql });
	await createPosts({ actions, graphql });
};

exports.createResolvers = ({
	actions,
	cache,
	getCache,
	createNodeId,
	createResolvers,
	getNode,
	store,
	reporter,
	getNodeAndSavePathDependency,
}) => {
	const { createNode, touchNode } = actions;

	// Add all media libary images so they can be queried by
	// childImageSharp
	createResolvers({
		WORDPRESS_MediaItem: {
			imageFile: {
				type: "File",
				async resolve(source, args, context, info) {
					if (source.sourceUrl) {
						let fileNodeID;
						let fileNode;
						let sourceModified;

						// Set the file cacheID, get it (if it has already been set)
						const mediaDataCacheKey = `wordpress-media-${source.mediaItemId}`;
						const cacheMediaData = await cache.get(mediaDataCacheKey);

						if (source.modified) {
							sourceModified = source.modified;
						}

						// If we have cached media data and it wasn't modified, reuse
						// previously created file node to not try to redownload
						if (cacheMediaData && sourceModified === cacheMediaData.modified) {
							fileNode = getNode(cacheMediaData.fileNodeID);

							// check if node still exists in cache
							// it could be removed if image was made private
							if (fileNode) {
								fileNodeID = cacheMediaData.fileNodeID;
								// https://www.gatsbyjs.org/docs/node-creation/#freshstale-nodes
								touchNode({
									nodeId: fileNodeID,
								});
							}
						}

						// If we don't have cached data, download the file
						if (!fileNodeID) {
							try {
								// Get the filenode
								fileNode = await createRemoteFileNode({
									url: encodeURI(source.sourceUrl),
									source,
									cache,
									createNode,
									createNodeId,
									reporter,
								});

								if (fileNode) {
									fileNodeID = fileNode.id;

									await cache.set(mediaDataCacheKey, {
										fileNodeID,
										modified: sourceModified,
									});
								}
							} catch (e) {
								// Ignore
								console.log(e);
								return null;
							}
						}

						if (fileNode) {
							return fileNode;
						}
					} //source.soureUrl
					return null;
				},
			},
		},
	});
};
