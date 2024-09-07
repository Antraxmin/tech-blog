import React, { useEffect } from 'react';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import Link from 'next/link';
import prism from 'remark-prism';
import Prism from 'prismjs';
import gfm from 'remark-gfm';
import { GetStaticProps, GetStaticPaths } from 'next';

interface PostData {
  id: string;
  title: string;
  date: string;
  category: string;
  content: string;
  contentHtml: string;
}

interface PostProps {
  postData: PostData;
}

export default function Post({ postData }: PostProps): JSX.Element {
  useEffect(() => {
    Prism.highlightAll();
  }, []);

  return (
    <div className="max-w-3xl mx-auto bg-white">
      <Link href="/">
        <p className="text-gray-500 hover:underline mb-4 inline-block text-sm">&larr; Back to posts</p>
      </Link>
      <h1 className="text-2xl font-bold mb-2">{postData.title}</h1>
      {/* <TableOfContents content={postData.content} /> */}
      <div className="text-gray-600 mb-4 text-xs">
        <span>{postData.date}</span> • <span>{postData.category}</span>
      </div>
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const postsDirectory = path.join(process.cwd(), 'posts');
  const filenames = fs.readdirSync(postsDirectory);

  const paths = filenames.map((filename) => ({
    params: { id: filename.replace(/\.md$/, '') },
  }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<PostProps> = async ({ params }) => {
  const postsDirectory = path.join(process.cwd(), 'posts');
  const fullPath = path.join(postsDirectory, `${params?.id}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  const matterResult = matter(fileContents);

  const processedContent = await remark()
    .use(gfm)
    .use(html, { sanitize: false })
    .use(prism)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  return {
    props: {
      postData: {
        id: params?.id as string,
        contentHtml,
        content: matterResult.content,
        ...(matterResult.data as Omit<PostData, 'id' | 'contentHtml' | 'content'>),
      },
    },
  };
};