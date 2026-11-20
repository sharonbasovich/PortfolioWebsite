import { featuredProjects } from '@src/constants/projects';

export default featuredProjects.map(({ title, link: href }) => ({ title, href }));
