export const getAllModels = (repositoryNode) => {
  const modelRepository = repositoryNode.title + " [" + repositoryNode.name + "]";

  return [
    ...(repositoryNode.models?.map((m) => {
      m.modelRepository = modelRepository;
      return m;
    }) ?? []),
    ...repositoryNode.subsidiarySites.flatMap((r) => getAllModels(r)),
  ];
};

export const sortRepositoryTree = (sites) => {
  sites.sort((a, b) => a.name.localeCompare(b.name));
  sites.forEach((node) => {
    if (node.subsidiarySites.length > 0) {
      sortRepositoryTree(node.subsidiarySites);
    }
  });
};

export const filterRepoTree = (repositoryNode, repositoryNames) => {
  if (repositoryNames?.length > 0) {
    if (repositoryNode.subsidiarySites.length > 0) {
      repositoryNode.subsidiarySites.forEach((node, index) => {
        repositoryNode.subsidiarySites[index] = filterRepoTree(node, repositoryNames);
      });
    }
    let models = repositoryNode.models;
    if (repositoryNames?.length > 0 && !repositoryNames.includes(repositoryNode.name)) {
      models = [];
    }
    return { ...repositoryNode, models: models };
  } else {
    return repositoryNode;
  }
};
