import { defineCollection, z } from 'astro:content';

const blogPosts = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const collections = {
  'blog-posts': blogPosts,
};
